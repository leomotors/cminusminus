import fetch from "node-fetch";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";

import { CocoaVersion, getElapsed } from "cocoa-discord-utils/meta";
import {
    CogSlashClass,
    FutureSlash,
    SlashCommand,
} from "cocoa-discord-utils/slash/class";
import {
    AutoBuilder,
    CocoaOption,
    Ephemeral,
    getEphemeral,
    getStatusFields,
} from "cocoa-discord-utils/template";

import { CommandInteraction } from "discord.js";

import { Version as MusicVersion } from "@leomotors/music-bot";

import { exec } from "../utils";

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

    @FutureSlash(async () => {
        const frame_list = (await fs.readdir("lib/golden-frame/assets"))
            .filter((f) => !f.endsWith(".json"))
            .map((i) => [i, i]) as [string, string][];

        return AutoBuilder("Create Golden Frame")
            .addUserOption(
                CocoaOption("who", "Who to put in the golden frame", true)
            )
            .addStringOption((option) =>
                option
                    .setName("frame")
                    .setDescription("Frame Name")
                    .setRequired(true)
                    .addChoices(frame_list)
            );
    })
    async goldenframe(ctx: CommandInteraction) {
        const frame = ctx.options.getString("frame", true);
        const target = ctx.options.getUser("who", true);

        const url = target.avatarURL({ size: 4096 });

        if (!url) {
            await ctx.reply(
                "Cannot Golden Frame: Target user has no profile picture!"
            );
            return;
        }

        await ctx.deferReply();

        const res = await fetch(url);

        if (!res.body) {
            await ctx.followUp("Error fetching profile picture!");
            return;
        }

        const stream = res.body.pipe(
            createWriteStream("lib/golden-frame/input.png")
        );

        await new Promise<void>((res, rej) => {
            stream.on("close", () => {
                res();
            });
            stream.on("error", () => {
                rej();
            });
        });

        await exec(
            `cd lib/golden-frame && src/cli.py build ${frame} input.png --output=output.png`
        );

        await ctx.followUp({ files: ["lib/golden-frame/output.png"] });
    }
}
