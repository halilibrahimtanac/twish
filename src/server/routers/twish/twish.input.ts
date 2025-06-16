import { z } from "zod";

export const newTwishInput = z.object({
    content: z.string().min(1),
    username: z.string().min(1)
});

export type TwishInputType = z.infer<typeof newTwishInput>;