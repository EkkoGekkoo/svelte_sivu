type DragData = {
    henkilo: { 
        id: number,
        nimi: string,
        lyhenne: string
    },
    source: {
        vuoroId: number,
        vuorotyyppi: number,
        aika: number,
        paiva: string
    } | null // null jos tulee PersonLististä
}

type Shift = {
    henkilo: {
        id: number,
        nimi: string
        lyhenne: string
    },
    vuoro: {
        id: number,
        pv: Date,
        aika: number,
        vuoro: number,
        note: string
    } | null
}

type ShiftType = {
    id: number,
    nimi: string,
    nro: number
}

type Person = {
    id: number,
    nimi: string,
    lyhenne: string
}