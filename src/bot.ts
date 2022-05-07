import "dotenv/config";

import {
    ActivityGroupLoader,
    checkLogin,
    Cocoa,
    ConsoleManager,
    useActivityGroup,
} from "cocoa-discord-utils";
import { SlashCenter } from "cocoa-discord-utils/slash";
import { DJCocoaOptions } from "cocoa-discord-utils/template";

import { Client } from "discord.js";

import { Music } from "@leomotors/music-bot";

import { MainCog, style } from "./commands";

const client = new Client(DJCocoaOptions);
const center = new SlashCenter(client, process.env.GUILD_IDS?.split(","));
const activity = new ActivityGroupLoader("data/activities.json");

center.addCogs(new MainCog(), new Music(client, style));
center.useHelpCommand(style);
center.on("error", async (name, err, ctx) => {
    Cocoa.log(
        `Command ${name} invoked by ${ctx.user.tag} encounter error at ${ctx.guild?.name}: ${err}`
    );
    await ctx.channel?.send(`เฮือก error occured: ${err}`);
});

client.on("ready", (cli) => {
    console.log(
        `Logged in as ${cli.user.tag}, took ${process
            .uptime()
            .toFixed(3)} seconds`
    );
    center.syncCommands();
    useActivityGroup(client, activity);
});

new ConsoleManager().useLogout(client).useReload(activity);
checkLogin(client, process.env.DISCORD_TOKEN);
