// Import dependencies.
import { Eden } from '#manager';
import { ChatInputCommandInteraction as Interaction } from 'discord.js';

// Declare a Command interface that extends the Meta interface.
export default interface Command extends Meta { }

// A command base class.
export default class Command implements Meta {

    // Fallback command description.
    public static about = 'No description provided.';

    // Merge the command meta data.
    public constructor(client: Eden, meta: Meta) {
        this.mergify(client, meta);
    }

    // Fallback command run handler.
    public async run(interaction: Interaction) {
        interaction.reply('This was not supposed to happen!');
    }
}
