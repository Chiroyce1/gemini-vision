export default [
	{
		description: "Default prompt",
		prompt: `What do you see in this picture? Describe in detail, along with reasoning.`,
	},

	{
		prompt: `Identify and describe distinctive geographical features to determine the likely location.
Consider natural landmarks, terrain characteristics, signboards, stores, roadsigns, or any unique elements visible. 
Provide insights on the elements in the image, and make an informed guess about the location based on the identified features.
If there are buildings or urban locations, try naming them or identifying them specifically.
Example response in JSON:

DO NOT return anything that is not there in the image, make sure ou confirm and check again to make sure
that all elements returned do really exist.

{
	"city":"New York City", 
	"region":"New York", 
	"country":"USA", 
	"elements": "NYC Taxi written on the taxi cabs, street sign saying '5th avenue', architecture of the skyscrapers, an exact Disney store in times square."
}
`,
		description: "Determine location from the frame using details.",
	},

	{
		description: "Identify a person in the frame.",
		prompt: `Imagine you are a skilled individual with expertise in identifying famous personalities. 
Develop a paragraph response that details the recognition of an individual in a given image.
Provide information such as their name, occupation, and any distinctive features contributing to the identification. 
Consider facial features, attire, and contextual cues. 
Show an overall confidence score out of 100% ONLY at THE END of the paragraph.

Confidence: 85%`,
	},

	{
		description: "Identify a car in the frame.",
		prompt: `Imagine you are a skilled individual with expertise in identifying car models.
Develop a one sentence response that details the recognition of a car in a given image.
Example: Make, Model, Year, Color, and any other distinctive features.
Then in a paragraph, provide information such as the car's make, model, year, and any distinctive features contributing to the identification.
Consider the car's body shape, headlights, taillights, and any other unique elements.
Show an overall confidence score out of 100% ONLY at THE END of the paragraph.
`,
	},
];
