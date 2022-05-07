import { CocoaVersion, getElapsed } from "cocoa-discord-utils/meta";
import { CogSlashClass, SlashCommand } from "cocoa-discord-utils/slash/class";
import {
    AutoBuilder,
    Ephemeral,
    getEphemeral,
    getStatusFields,
} from "cocoa-discord-utils/template";

import { CommandInteraction } from "discord.js";

import { Version as MusicVersion } from "@leomotors/music-bot";

import { style } from "./style";

export class MainCog extends CogSlashClass {
    private timePinged = 0;

    constructor() {
        super("Main Cog", "Main Cog of this bot");
    }

    @SlashCommand(AutoBuilder("Pong!"))
    async ping(ctx: CommandInteraction) {
        await ctx.reply(
            `Pong! Respond took ${getElapsed(
                ctx.createdAt
            )} ms. Since start, I have been pinged ${++this.timePinged} times!`
        );
    }

    @SlashCommand(AutoBuilder("Get Bot's Status").addBooleanOption(Ephemeral()))
    async status(ctx: CommandInteraction) {
        const ephemeral = getEphemeral(ctx);

        const emb = style
            .use(ctx)
            .setTitle("C--'s Status")
            .setDescription(
                `[C--](https://github.com/Leomotors/cminusminus) Bot Version: ${process.env.npm_package_version}\n[Cocoa Discord Utils](https://github.com/Leomotors/cocoa-discord-utils) Version: ${CocoaVersion}\n[@leomotors/music-bot](https://github.com/Leomotors/music-bot) Version: ${MusicVersion}`
            )
            .addFields(...(await getStatusFields(ctx)));

        await ctx.reply({ embeds: [emb], ephemeral });
    }
}
