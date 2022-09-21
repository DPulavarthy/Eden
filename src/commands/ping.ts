export default class Ping extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about(): string {
        return 'Pings the bot.';
    }

    /**
     * Get the command privacy.
     * 
     * @returns {boolean}
     */
    public static get ephemeral(): boolean {
        return false;
    }

    /**
     * Get the command options.
     * 
     * @returns {ChatInputApplicationCommandData[]}
     */
    public static get options(): object[] {
        return [];
    }

    /**
     * Execute the command logic.
     * 
     * @param {Interaction} interaction
     * @returns {Promise<void>}
     */
    public async run(interaction: Interaction, resolve: Function, reject: Function): Promise<void> {

        // Reply with embed.
        await interaction.editReply({
            content: null,
            embeds: [
                {
                    ...embed,
                    description: [
                        `Websocket Ping: ${client.ws.ping}ms`,
                        `Message Ping: ${Math.abs(Date.now() - interaction.createdTimestamp)}ms`,
                    ].join('\n').codify(),
                    author: {
                        name: `Requested by ${interaction.user.tag}`,
                        icon_url: interaction.user.displayAvatarURL(),
                    },
                }
            ],
        }).catch(error => reject(error));
        resolve();
    }
}
