// Import dependencies.
import { ChatInputCommandInteraction as Interaction } from 'discord.js';

// Declare a Command interface that extends the Meta interface.
export default interface Command extends Meta { }

// A command base class.
export default class Command implements Meta {

    // Fallback command description.
    public static about = 'No description provided.';

    // Merge the command meta data.
    public constructor(meta: Meta) {
        this.mergify(meta);
    }

    // Fallback command run handler.
    public async run(interaction: Interaction, resolve: Function, reject: Function) {
        interaction.reply('This was not supposed to happen!');
    }
}
