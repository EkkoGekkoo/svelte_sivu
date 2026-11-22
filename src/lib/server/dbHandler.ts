import * as mariadb from "mariadb";
import { config } from "dotenv";
config();

export const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 1
});

export const getPeople = async () => {
    const conn = await pool.getConnection();
    const req = await conn.query("SELECT * FROM henkilo ORDER BY lyhenne;");
    
    conn.release();

    return req;
}

export const getShiftTypes = async () => {
    const conn = await pool.getConnection();
    const req = await conn.query("SELECT * FROM vuorotyyppi ORDER BY nro;");
    
    conn.release();

    return req;
}

export const getShifts = async (day: string) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const dayDate = new Date(day).toISOString()

        const shifts = await conn.query(`
            SELECT 
            V.id AS vuoroId,
            V.pv, 
            V.vuoro AS vuorotyyppi,
            V.note,
            V.aika,
            H.id AS henkiloId,
            H.nimi AS henkilo,
            H.lyhenne
            FROM vuoro V JOIN henkilo H ON V.henkilo = H.id 
            WHERE pv = ?;`
        , [dayDate]);

        const formattedShift = [];
        for(const shift of shifts) {
            const henkilo = {
                id: shift.henkiloId,
                nimi: shift.henkilo,
                lyhenne: shift.lyhenne
            }
            const vuoro = {
                id: shift.vuoroId,
                pv: shift.pv,
                aika: shift.aika,
                vuoro: shift.vuorotyyppi,
                note: shift.note
            }
            formattedShift.push({henkilo, vuoro});
        }

        return formattedShift;
    }
    finally {
        await conn?.release();
    }
}

export const addShift = async (data: any) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const alreadyExists  = (await conn.query("SELECT COUNT(*) > 0 AS c FROM vuoro WHERE pv = ? AND henkilo = ? AND aika = ? AND vuoro = ?;",
            [data.vuoro.paiva, data.henkilo.id, data.vuoro.aika, data.vuoro.vuorotyyppi]
        ))[0]["c"];
        if(alreadyExists) return {success: false, status: "exists"};
        
        const sourceId = data.source ? data.source.id : -1;
        const sourceShift = data.source ? data.source.vuoro : -1;
        const absentCol = (await conn.query("SELECT id FROM vuorotyyppi WHERES"))

            const absent = (await conn.query("SELECT id FROM vuoro WHERE pv = ? AND henkilo = ? AND vuoro = (SELECT id FROM vuorotyyppi WHERE nimi = 'Poissa koko päivän');",
            [data.vuoro.paiva, data.henkilo.id, data.vuoro.aika]
        ))[0];
        if(absent && sourceId != absent.id) return {success: false, status: "absent"};

        const overlap  = (await conn.query("SELECT vuoro FROM vuoro WHERE pv = ? AND henkilo = ? AND aika = ?;",
            [data.vuoro.paiva, data.henkilo.id, data.vuoro.aika]
        ))[0];
        if(overlap && sourceShift != overlap.vuoro) return {success: false, status: "overlap"};

        await conn.beginTransaction();
        if(data.source) await conn.query("DELETE FROM vuoro WHERE id = ?;", [data.source.id]);
        const newShift = await conn.query("INSERT INTO vuoro(pv, vuoro, aika, henkilo, note) VALUES(?, ?, ?, ?, ?);",
            [
                new Date(data.vuoro.paiva),
                data.vuoro.vuorotyyppi,
                data.vuoro.aika,
                data.henkilo.id,
                null
            ]
        );

        const absentToday = (await conn.query("SELECT COUNT(*) > 0 AS c FROM vuoro WHERE pv = ? AND henkilo = ? AND aika = ? AND vuoro = (SELECT id FROM vuorotyyppi WHERE nimi = 'Poissa koko päivän');",
            [data.vuoro.paiva, data.henkilo.id, data.vuoro.aika, data.vuoro.vuorotyyppi]
        ))[0]["c"] == 1;

        if(absentToday) await conn.query("DELETE FROM vuoro WHERE pv = ? AND henkilo = ? AND vuoro != (SELECT id FROM vuorotyyppi WHERE nimi = 'Poissa koko päivän');",
            [data.vuoro.paiva, data.henkilo.id, data.vuoro.aika, data.vuoro.vuorotyyppi])
        
        await conn.commit();

        if(absentToday) return {success: true, status: "added_to_absent"};
        else return {success: true, status: data.source ? "moved" : "added"};
    }
    catch(err) {
        await conn?.rollback();
        console.log(err)
        return {success: false, status: "error"};
    }
    finally {
        if(conn) conn.release();
    }
}

export const deleteShift = async (id: number) => {
    let conn;
    try {
        console.log(id)
        conn = await pool.getConnection();
        const q = await conn.query("DELETE FROM vuoro WHERE id = ?", [id]);
    }
    catch(err) {
        console.log(err)
    }
    finally {
        if(conn) conn.end();
    }
}