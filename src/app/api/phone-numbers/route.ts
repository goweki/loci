// app/api/phone-numbers/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { phoneNumber, displayName } = body;

  // Check subscription limits
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: { include: { plan: true } },
      phoneNumbers: true,
    },
  });

  if (!user?.subscription || user.subscription.status !== "ACTIVE") {
    return new NextResponse("Active subscription required", { status: 402 });
  }

  if (user.phoneNumbers.length >= user.subscription.plan.maxPhoneNumbers) {
    return new NextResponse("Phone number limit reached", { status: 400 });
  }

  // Create phone number record
  const newPhoneNumber = await db.phoneNumber.create({
    data: {
      userId: session.user.id,
      phoneNumber,
      displayName,
      status: "PENDING",
    },
  });

  // TODO: Implement WhatsApp Business API registration flow

  return NextResponse.json({ phoneNumber: newPhoneNumber });
}
