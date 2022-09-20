// Import dependencies.
import { Command } from '#manager';
import { ChatInputCommandInteraction as Interaction } from 'discord.js';

// Ping command.
export default class Ping extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about() {
        return 'Pings the bot.';
    }

    /**
     * Get the command privacy.
     * 
     * @returns {boolean}
     */
    public static get ephemeral() {
        return false;
    }

    /**
     * Get the command options.
     * 
     * @returns {ChatInputApplicationCommandData[]}
     */
    public static get options() {
        return [
            {
                name: 'message',
                description: 'A message for the bot to send back to you!',
                type: Options.String,
                required: false
            }
        ];
    }

    /**
     * Execute the command logic.
     * 
     * @param {Interaction} interaction
     * @returns {Promise<void>}
     */
    public async run(interaction: Interaction): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const pingTime = Date.now();
            await interaction.editReply(`Took \`${Date.now() - pingTime}ms\`. ${interaction.options.getString('message') ?? ''}`);
            resolve();
        })
    }
}
