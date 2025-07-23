// recommend-vehicles-assignments.ts
'use server';

/**
 * @fileOverview Recommends vehicles and assignments based on user's favorited items.
 *
 * - recommendVehiclesAssignments - A function that handles the recommendation process.
 * - RecommendVehiclesAssignmentsInput - The input type for the recommendVehiclesAssignments function.
 * - RecommendVehiclesAssignmentsOutput - The return type for the recommendVehiclesAssignments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendVehiclesAssignmentsInputSchema = z.object({
  favoriteVehicles: z.array(z.string()).describe('List of user-favorited vehicle IDs.'),
  favoriteAssignments: z.array(z.string()).describe('List of user-favorited assignment IDs.'),
  allVehicles: z.array(z.string()).describe('List of all vehicle IDs.'),
  allAssignments: z.array(z.string()).describe('List of all assignment IDs.'),
});
export type RecommendVehiclesAssignmentsInput = z.infer<typeof RecommendVehiclesAssignmentsInputSchema>;

const RecommendVehiclesAssignmentsOutputSchema = z.object({
  recommendedVehicles: z.array(z.string()).describe('Recommended vehicle IDs based on user preferences.'),
  recommendedAssignments: z.array(z.string()).describe('Recommended assignment IDs based on user preferences.'),
});
export type RecommendVehiclesAssignmentsOutput = z.infer<typeof RecommendVehiclesAssignmentsOutputSchema>;

export async function recommendVehiclesAssignments(input: RecommendVehiclesAssignmentsInput): Promise<RecommendVehiclesAssignmentsOutput> {
  return recommendVehiclesAssignmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendVehiclesAssignmentsPrompt',
  input: {schema: RecommendVehiclesAssignmentsInputSchema},
  output: {schema: RecommendVehiclesAssignmentsOutputSchema},
  prompt: `You are an AI assistant specializing in recommending vehicles and assignments based on user preferences.

  Given the user's favorited vehicles: {{favoriteVehicles}}
  And their favorited assignments: {{favoriteAssignments}}
  From the pool of all vehicles: {{allVehicles}}
  And all assignments: {{allAssignments}}

  Recommend a list of vehicles and assignments that the user might find interesting based on their favorited items.
  Explain your reasoning briefly, then provide two lists of IDs. 
  The vehicles they might like, based on their favorites, and the assignments that they might like.
  Output the lists as simple javascript arrays with double quotes surrounding each element. 

  For example:
  \nReasoning: The user likes Vans and Trucks, so based on what they like they might also like Utility Vehicles and Buses.\nRecommended Vehicles: []\nRecommended Assignments: []`
});

const recommendVehiclesAssignmentsFlow = ai.defineFlow(
  {
    name: 'recommendVehiclesAssignmentsFlow',
    inputSchema: RecommendVehiclesAssignmentsInputSchema,
    outputSchema: RecommendVehiclesAssignmentsOutputSchema,
  },
  async (input) => {
    // Filter out favorited items from the general pool before sending to the model
    const availableVehicles = input.allVehicles.filter(v => !input.favoriteVehicles.includes(v));
    const availableAssignments = input.allAssignments.filter(a => !input.favoriteAssignments.includes(a));

    const {output} = await prompt({
        ...input,
        allVehicles: availableVehicles,
        allAssignments: availableAssignments,
    });
    return output!;
  }
);
