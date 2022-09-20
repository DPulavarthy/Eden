// Import dependencies.
import { Command } from '#manager';
import { ChatInputCommandInteraction as Interaction } from 'discord.js';

// Ping command.
export default class Man extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about() {
        return 'A manual for the bot.';
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
                name: 'command',
                description: 'A command name to get information about.',
                type: Options.String,
                required: false,
            }
        ];
    }

    /**
     * Execute the command logic.
     * 
     * @param {Interaction} interaction
     * @returns {Promise<void>}
     */
    public async run(interaction: Interaction, resolve: Function, reject: Function): Promise<void> {
        const command = client._commands.get(interaction.options.getString('command') || 'man');
        if (!command) reject(`A command with the name '${interaction.options.getString('command')}' does not exist.`)
        await interaction.editReply({
            content: null,
            embeds: [
                {
                    ...embed,
                    description: [
                        `**Name:** \`${command?.title.slice(0, 1).toUpperCase()}${command?.title.slice(1)}\``,
                        `**Description:** \`${command?.about}\``,
                        `**Group:** \`${command?.group}\``,
                        `**Ephemeral:** \`${command?.ephemeral ? 'Yes' : 'No'}\``,
                        `**Options:** \`${command?.options.length ? command?.options.map(option => option.name).join(', ') : 'None'}\``,
                        `**Lines:** \`${command?.lines.toLocaleString()}\``,
                    ].join('\n'),
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
