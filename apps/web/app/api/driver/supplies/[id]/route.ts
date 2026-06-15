import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../../../../../lib/cloudinary";
import { connectToDatabase } from "../../../../../lib/mongodb";
import SupplyLog from "../../../../../models/SupplyLog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid supply id." }, { status: 400 });
  }

  const formData = await req.formData();
  const billImage = formData.get("billImage");
  const billImageFile =
    billImage &&
    typeof billImage === "object" &&
    "arrayBuffer" in billImage &&
    "size" in billImage &&
    Number(billImage.size) > 0
      ? (billImage as File)
      : null;

  if (!billImageFile) {
    return NextResponse.json({ error: "Please choose an image to upload." }, { status: 400 });
  }

  if (!billImageFile.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload a valid image file." }, { status: 400 });
  }

  if (billImageFile.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image is too large. Please keep it under 8 MB." }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await SupplyLog.findOne({
    _id: new Types.ObjectId(id),
    driver: session.user.id,
    logType: "cash",
  }).lean();

  if (!existing) {
    return NextResponse.json({ error: "Cash log not found." }, { status: 404 });
  }

  if (existing.billImageUrl) {
    return NextResponse.json(
      { error: "Bill image is already uploaded for this entry and cannot be changed." },
      { status: 400 },
    );
  }

  let uploadedBillImage: { secureUrl: string; publicId: string } | null = null;

  try {
    uploadedBillImage = await uploadImageToCloudinary(billImageFile);

    await SupplyLog.collection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          billImageUrl: uploadedBillImage.secureUrl,
          billImagePublicId: uploadedBillImage.publicId,
        },
      },
    );

    const updated = await SupplyLog.findById(id)
      .populate("vehicle", "name vehicleNumber capacity")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "Cash log not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (uploadedBillImage?.publicId) {
      await deleteImageFromCloudinary(uploadedBillImage.publicId).catch(() => undefined);
    }

    const message =
      error instanceof Error ? error.message : "Failed to upload bill image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
