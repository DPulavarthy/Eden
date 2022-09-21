export default class Man extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about(): string {
        return 'A manual for the bot.';
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
        return [
            {
                name: 'query',
                description: 'A command or group name to get information about.',
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

        // Get the query.
        const query: string | null = interaction.options.getString('query');

        // Check if query is a command (fallback to this command if no query was given).
        const command: Meta | undefined = client._commands.get(query || 'man');

        // Check if query is a group.
        const groups: string[] = []
        client._commands.map((command: Meta) => groups.push(groups.includes(command.group) ? '' : command.group))
        let group: string | boolean | undefined = query ? groups.filter(g => g).find(g => g.endsWith(query)) : false;

        // If neither, tell user the query is invalid.
        if (!group && !command) reject(`A command or group with the name '${query}' does not exist.`)

        // If data exists, send it.
        else await interaction.editReply({
            content: null,
            embeds: [
                {
                    ...embed,
                    description: group ? [
                        `**Name:** \`${group}\``,
                        `**Commands:** \`${client._commands.filter(c => c.group.endsWith(group as string)).map(c => c.title).join('\` \`')}\``,
                        `**JS Path:** \`./${command?.group}/\``,
                        `**TS Path:** \`./${command?.group.replace(/lib/g, 'src')}/\``,
                    ].join('\n') : [
                        `**Name:** \`${command?.title.slice(0, 1).toUpperCase()}${command?.title.slice(1)}\``,
                        `**Description:** \`${command?.about}\``,
                        `**Group:** \`${command?.group}\``,
                        `**Ephemeral:** \`${command?.ephemeral ? 'Yes' : 'No'}\``,
                        `**Options:** \`${command?.options.length ? command?.options.map(option => option.name).join(', ') : 'None'}\``,
                        `**Lines:** \`${command?.lines.toLocaleString()}\``,
                        `**JS Path:** \`./${command?.group}/${command?.title}.js\``,
                        `**TS Path:** \`./${command?.group.replace(/lib/g, 'src')}/${command?.title}.js\``,
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
