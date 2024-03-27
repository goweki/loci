import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
export const revalidate = 0; // false | 'force-cache' | 0 | number

export async function GET(req) {
    const url = new URL(req.url);
    const inst = url.searchParams.get("inst");

    const mongodbClient = await clientPromise; // resolve MongoClient promise
    const db = mongodbClient.db(process.env.ATLAS_DB); //target DB

    try {
        console.log(
            `GET REQUEST /api/user/data\n > institution: ${inst}`
        );
        // target COLLECTION
        const collection = db.collection('data');
        // FIND Docs
        const data_ = await collection.find(inst === "loci" ? {} : { institution: inst }).toArray();
        return Response.json({ success: data_ });
    } catch (error) {
        // handle ERROR if caught
        console.log(` > Error caught at api/user/data GET \n >> ${error}\n`);
        return Response.json({
            error: "Could not fetch data",
        });
    }
}