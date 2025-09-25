// Add this near your other imports
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the teacher schema
export const TeacherSchema = z.object({
  employeeId: z.string(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string(),
  password: z.string(),
  phoneNumber: z.number().optional(),
  whatsappNumber: z.number().optional(),
  joiningDate: z.string(),
  salary: z.string().min(1, "Salary is required"),
  bankAccount: z.string().optional(),
  ifscIbanBsb: z.string().optional(),
  branch: z.array(z.string()).min(1, "At least one branch is required"),
  specialization: z.string().optional(),
  residenceAddress: z.string().optional(),
  street: z.string().optional(),
  community: z.string().optional(),
  flatNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});


export type TeacherFormValues = z.infer<typeof TeacherSchema>;
