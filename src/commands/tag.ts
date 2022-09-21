import { Cache } from '#manager'

export default class Tag extends Command {

    /**
     * Get the command description.
     * 
     * @returns {string}
     */
    public static get about(): string {
        return 'Text tag manager.';
    }

    /**
     * Get the command privacy.
     * 
     * @returns {boolean}
     */
    public static get ephemeral(): boolean {
        return true;
    }

    /**
     * Get the command options.
     * 
     * @returns {ChatInputApplicationCommandData[]}
     */
    public static get options(): object[] {
        return [
            {
                name: 'create', description: 'Add a new text tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the text tag.', type: Options.String, required: true },
                    { name: 'content', description: 'The content of the text tag.', type: Options.String, required: true },
                ]
            },
            {
                name: 'delete', description: 'Delete a text tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the text tag.', type: Options.String, required: true },
                    { name: 'verify', description: 'Verify the deletion.', type: Options.Boolean, required: true },
                ]
            },
            {
                name: 'fetch', description: 'Get a text tag.', type: Options.Subcommand,
                options: [
                    { name: 'name', description: 'The name of the text tag.', type: Options.String, required: true },
                ]
            },
            {
                name: 'update', description: 'Update a text tag.', type: Options.Subcommand, options: [
                    { name: 'name', description: 'The current name of the text tag.', type: Options.String, required: true },
                    { name: 'content', description: 'The new content of the text tag.', type: Options.String, required: true },
                    { name: 'newname', description: 'The new name of the text tag.', type: Options.String, required: false },
                ]
            },
            { name: 'list', description: 'List all text tags.', type: Options.Subcommand, options: [] },
            {
                name: 'purge', description: 'Delete all text tags in the trash.', type: Options.Subcommand,
                options: [
                    { name: 'verify', description: 'Verify the deletion.', type: Options.Boolean, required: true },
                ]
            },
        ];
    }

    /**
     * Execute the command logic.
     * 
     * @param {Interaction} interaction
     * @returns {Promise<void>}
     */
    public async run(interaction: Interaction, resolve: Function, reject: Function): Promise<void> {

        // Get the subcommand.
        const command = interaction.options.getSubcommand(true);

        // Store switch case values here.
        let result;
        let message;
        let fetch = {
            tag: '',
            accessed: 0,
        };

        switch (command) {

            // Create a new tag.
            case 'create': {

                // Get the action parameters.
                const name = interaction.options.getString('name', true);
                const content = interaction.options.getString('content', true);

                // Run the action.
                result = await Cache.tags.create(name, content, interaction.user).catch(error => error);

                // Post the result.
                message = result as string ?? 'Tag successfully created. Your action has been logged.';
                break;
            }

            // Delete a tag.
            case 'delete': {

                // Get the action parameters.
                const verify = interaction.options.getBoolean('verify', true);

                // Make sure the action is verified.
                if (verify) {

                    // Run the action.
                    result = await Cache.tags.delete(interaction.options.getString('name', true), interaction.user).catch(error => error);

                    // Post the result.
                    message = result as string ?? 'Tag successfully deleted. Your action has been logged.';
                } else {
                    message = 'Deletion cancelled.';
                }
                break;
            }

            // Fetch a tag.
            case 'fetch': {

                // Run the action.
                const tag: object | undefined = await Cache.tags.fetch(interaction.options.getString('name'));

                // Post the result.
                message = tag ? `${(tag as { key: string }).key}: ${(tag as { value: string }).value} [Last accessed ${(Date.now() - (tag as { accessed: number }).accessed).timify(true)}]` : 'Tag does not exist.';
                fetch.accessed = tag ? (tag as { accessed: number }).accessed : 0;
                fetch.tag = tag ? client.users.cache.get((tag as { user: string }).user)?.tag ?? '' : '';
                break;
            }

            // Update a tag.
            case 'update': {

                // Get the action parameters.
                const name = interaction.options.getString('name', true);
                const content = interaction.options.getString('content', true);
                const newname = interaction.options.getString('newname') ?? null;

                // Run the action.
                result = await Cache.tags.update(name, newname, content, interaction.user).catch(error => error);

                // Post the result.
                message = result as string ?? 'Tag successfully updated. Your action has been logged.';
                break;
            }

            // List all tags.
            case 'list': {

                // Run the action.
                const tags = Cache.tags.list();

                // Post the result.
                message = tags.exists() ? tags.map(set => `${set.key}: ${set.value} [Last accessed ${(Date.now() - set.accessed).timify(true)} ago]`).join('\n') : 'No tags found.';
                break;
            }

            // Purge the trash.
            case 'purge': {

                // Get the action parameters.
                const verify = interaction.options.getBoolean('verify', true);

                // Make sure the action is verified.
                if (verify) {

                    // Run the action.
                    const data = Cache.tags.purge();

                    // Post the result.
                    message = data.exists() ? `Deleted ${data.length} tag(s). View them below:\n${data.map(set => `${set.key}: ${set.value} [Last accessed ${(Date.now() - set.accessed).timify(true)} ago]`).join('\n')}` : 'No tags found.';
                } else {
                    message = 'Purge cancelled.';
                }
                break;
            }
        }

        // Send the message.
        interaction.editReply({
            content: null, embeds: [{
                ...embed,
                description: (message || 'Action Completed!').codify(),
                timestamp: new Date(command === 'fetch' ? fetch.accessed : Date.now()).toISOString(),
                footer: {
                    text: command === 'fetch' ? `Last modified by ${fetch.tag}` : embed.footer.text,
                    icon_url: command === 'fetch' ? interaction.user.displayAvatarURL() : embed.footer.icon_url,
                }
            }]
        }).catch(error => reject(error));
        resolve();
    }
}
