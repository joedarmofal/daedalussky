import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { members } from "@/db/schema/members";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_KINDS = new Set(["member-photo", "certification-image"]);

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-").slice(0, 80);
}

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const requesterRows = await db
    .select({
      organizationId: members.organizationId,
    })
    .from(members)
    .where(eq(members.authSubject, user.id))
    .limit(1);
  const requester = requesterRows[0];
  if (!requester) {
    return NextResponse.json(
      { error: "No member profile mapped to this auth user." },
      { status: 403 },
    );
  }

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

  const admin = createAdminClient();
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
