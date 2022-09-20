// Import dependencies.
import { Client, Collection, Interaction, Message, Options, User, ChatInputApplicationCommandData } from 'discord.js';
import { Preload, Handler } from '#manager';

// Declare a custom global client interface.
export default interface Eden extends Client {
    (): void;
    _commands: Collection<string, Meta>;
}

// Client options.
export default class Eden extends Client {

    public constructor() {

        // Initialize the client.
        super({
            intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
            makeCache: Options.cacheWithLimits({ MessageManager: { maxSize: 200 } }),
        });

        // Preload program modules.
        new Preload().load();

        // Listen to the ready event.
        this.on('ready', this.ready);

        // Listen to the messageCreate event.
        this.on('messageCreate', this.message);

        // Listen to the interactionCreate event.
        this.on('interactionCreate', this.interaction);

        // Load commands and login to the Discord API.
        Handler.load(this).then(() => this.login(process.env.TOKEN)).catch(error => { throw new Error(error) });

    };

    /**
     * The ready event handler.
     * 
     * @returns {void}
     * @memberof Eden
     * 
     */
    private ready() {

        // Notify the console that the bot is ready.
        console.log(`Logged in as ${this.user?.tag}!`);
    };

    /**
     * The messageCreate event handler.
     * 
     * @param {message} - A discord message object.
     * @returns {void}
     */
    async message(message: Message) {

        // Reject bots.
        if (message.author.bot) return;

        // Check if the bot was mentioned.
        if (message.mentions.has(this.user as User)) {

            // Notify the user that the bot is building commands.
            const msg = await message.reply('Building Commands... Please Wait!');

            // Build commands.
            let data: ChatInputApplicationCommandData[] = [];
            for (const command of client._commands.values()) {
                data.push({
                    name: command.title,
                    description: command.about,
                    options: command.options
                });
            }

            // Set Commands.
            message.guild?.commands.set(data);

            // Notify the user that the bot is done building commands. 
            msg.edit('Commands Built!');
        }
    }

    /**
     * The interactionCreate event handler.
     * 
     * @param {message} - A discord interaction object.
     * @returns {void}
     */
    async interaction(interaction: Interaction) {

        // Check if the interaction is a command.
        if (!interaction.isCommand()) return;

        // Get the command.
        const command = client._commands.get(interaction.commandName) ?? { ephemeral: false, title: null };

        // Defer reply as soon as possible.
        await interaction.deferReply({ ephemeral: command.ephemeral });

        // Check if the command exists.
        if (command.title) {

            // Run the command.
            const error = await new Promise(async (resolve, reject) => command.run(interaction, resolve, reject)).catch(error => error);

            // Check if there was an error.
            if (error) await interaction.editReply(`An error occurred while executing the command \`${command.title}\`: \`${error}\``);
        }
    }
}
