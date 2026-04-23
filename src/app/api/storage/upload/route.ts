import { NextResponse } from "next/server";

import { getRequesterFromRequest } from "@/lib/api-auth";
import { createSupabaseStorageAdminClient } from "@/lib/supabase-storage-admin";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_KINDS = new Set(["member-photo", "certification-image"]);

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-").slice(0, 80);
}

export async function POST(request: Request): Promise<NextResponse> {
  const authResult = await getRequesterFromRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { requester } = authResult;

  const form = await request.formData();
  const file = form.get("file");
  const kindRaw = String(form.get("kind") ?? "");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (!ALLOWED_KINDS.has(kindRaw)) {
    return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image too large (max 10MB)." },
      { status: 400 },
    );
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "member-assets";
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "bin"
    : "bin";
  const safeName = sanitizeFilename(file.name || `upload.${ext}`);
  const path = `${requester.organizationId}/${kindRaw}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const admin = createSupabaseStorageAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });
  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    bucket,
    path,
    storageRef: `supabase://${bucket}/${path}`,
  });
}
