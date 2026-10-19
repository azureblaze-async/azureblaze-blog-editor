import { createServerFn } from "@tanstack/react-start";
import { AwsClient } from "aws4fetch";
import { z } from "zod";
import { requireMediaAdmin } from "./media-auth";
import { IMAGE_TYPES, publicImageUrl, validateImage, validateImageKey } from "./media";

const imageInput = z.object({ type: z.string(), size: z.number(), folder: z.enum(["covers", "inline"]) });

export const prepareImageUpload = createServerFn({ method: "POST" })
  .middleware([requireMediaAdmin])
  .inputValidator((input: unknown) => imageInput.parse(input))
  .handler(async ({ data }) => {
    validateImage(data.type, data.size);
    const account = process.env["R2_ACCOUNT_ID"];
    const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
    const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
    const bucket = process.env["R2_BUCKET_NAME"];
    const base = process.env["R2_PUBLIC_BASE_URL"];
    if (!account || !accessKeyId || !secretAccessKey || !bucket || !base) {
      throw new Error("R2 uploads are not configured. Add the five R2 environment variables in your hosting settings.");
    }
    if (!/^[a-f0-9]{32}$/.test(account) || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
      throw new Error("Check R2_ACCOUNT_ID and R2_BUCKET_NAME.");
    }
    const key = `${data.folder}/${crypto.randomUUID()}.${IMAGE_TYPES[data.type]}`;
    publicImageUrl(base, key);
    const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    const request = await client.sign(`https://${account}.r2.cloudflarestorage.com/${bucket}/${key}?X-Amz-Expires=300`, {
      method: "PUT", headers: { "Content-Type": data.type }, aws: { signQuery: true, allHeaders: true },
    });
    return { key, uploadUrl: request.url };
  });

export const completeImageUpload = createServerFn({ method: "POST" })
  .middleware([requireMediaAdmin])
  .inputValidator((input: unknown) => z.object({ key: z.string(), type: z.string(), size: z.number() }).parse(input))
  .handler(async ({ data }) => {
    validateImage(data.type, data.size);
    validateImageKey(data.key);
    const account = process.env["R2_ACCOUNT_ID"];
    const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
    const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
    const bucket = process.env["R2_BUCKET_NAME"];
    const base = process.env["R2_PUBLIC_BASE_URL"];
    if (!account || !accessKeyId || !secretAccessKey || !bucket || !base) throw new Error("R2 uploads are not configured.");
    const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    const request = await client.sign(`https://${account}.r2.cloudflarestorage.com/${bucket}/${data.key}`, { method: "HEAD" });
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`R2 upload verification failed (${response.status}). Check bucket access and Object Read & Write permissions.`);
    }
    const size = Number(response.headers.get("Content-Length"));
    validateImage(response.headers.get("Content-Type") ?? "", size);
    if (size !== data.size || response.headers.get("Content-Type") !== data.type) throw new Error("Uploaded image does not match the selected file.");
    const publicUrl = publicImageUrl(base, data.key);
    const publicResponse = await fetch(publicUrl, { method: "HEAD" });
    if (!publicResponse.ok) throw new Error("Image uploaded, but its public URL is unavailable. Check R2_PUBLIC_BASE_URL and enable bucket public access.");
    return { publicUrl };
  });