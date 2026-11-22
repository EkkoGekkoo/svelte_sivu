import { json } from "@sveltejs/kit";
import { addShift, deleteShift } from "$lib/server/dbHandler";

export const POST = async ({request}) => {
    const body = await request.json();
    const newShift = await addShift(body);
    console.log(newShift)

    return json({});
}

export const DELETE = async ({request}) => {
    const id = await request.json();
    const newShift = await deleteShift(id);
    console.log(newShift)

    return json({});
}