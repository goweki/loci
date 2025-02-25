import { addSubTime } from "@/helpers/dataHandlers";
import prisma from "@/lib/prisma/prisma";
import { withAuthGeneral } from "@/lib/authRouteWrappers";
import { ObjectId } from "mongodb";

export const revalidate = 0; // false | 'force-cache' | 0 | number

const maxHistory = process.env.NEXT_PUBLIC_MAX_HISTORY;
const dbName = process.env.ATLAS_DB;

async function getHandler(req, user) {
  const url = new URL(req.url);

  try {
    console.log(`GET REQUEST /api/user/data\n > by user : `, user);
    // user UUID
    const user_ = await prisma.user.findUnique({
      where: { email: user.email },
    });
    const userID = user_.id;
    // Fetch user devices by ownerId
    const devices_ = await prisma.device.findMany({
      where: { ownerId: userID },
    });

    return Response.json({ success: { devices: devices_ } });
  } catch (error) {
    // handle ERROR if caught
    console.log(` > Error caught at api/user/data GET \n >> `, error);
    return Response.json({
      status: 500,
      message: error.message || "Unknown error",
    });
  }
}

export const GET = withAuthGeneral(getHandler);
