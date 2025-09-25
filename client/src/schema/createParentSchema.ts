import { z } from "zod";

export const CreateParentSchema = z.object({
  first_name: z.string().min(1, { message: "Field is required!" }),
  middle_name: z.string(),
  last_name: z.string().min(1, { message: "Field is required!" }),
  username: z.string().min(1, { message: "Field is required!" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().min(1, { message: "Field is required!" }),
  whatsapp_no: z.string(),
  email: z
    .string()
    .min(1, { message: "Field is required!" })
    .email({ message: "Invalid email address!" }),
  street: z.string(),
  community: z.string(),
  residence_address: z.string(),
  flat_no: z.string(),
  status: z
    .enum(["active", "inactive"])
    .refine((val) => val === "active" || val === "inactive", {
      message: "Status is required",
    }),
});

export type CreateParentType = z.infer<typeof CreateParentSchema>;
