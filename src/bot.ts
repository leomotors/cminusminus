import "dotenv/config";

import {
  ActivityGroupLoader,
  ActivityManager,
  checkLogin,
  Cocoa,
  ConsoleManager,
} from "cocoa-discord-utils";
import { SlashCenter } from "cocoa-discord-utils/slash";
import { CocoaIntent } from "cocoa-discord-utils/template";

import { Client } from "discord.js";

import { Music } from "@leomotors/music-bot";

import { MainCog, style } from "./commands";

const client = new Client(new CocoaIntent().useGuildSlash().useGuildVoice());
const center = new SlashCenter(client, "Global");

center.addCogs(new MainCog(), new Music(client, style));
center.useHelpCommand(style);
center.on("error", async (name, err, ctx) => {
  Cocoa.log(
    `Command ${name} invoked by ${ctx.user.tag} encounter error at ${ctx.guild?.name}: ${err}`
  );
  await ctx.channel?.send(`เฮือก error occured: ${err}`);
});

const activityLoader = new ActivityGroupLoader("data/activities.json");
const activityManager = new ActivityManager(activityLoader, client);

client.on("ready", (cli) => {
  console.log(
    `Logged in as ${cli.user.tag}, took ${process.uptime().toFixed(3)} seconds`
  );
  center.syncCommands(true);
  activityManager.nextActivity();
});

new ConsoleManager().useLogout(client).useReload(activityLoader);
checkLogin(client, process.env.DISCORD_TOKEN);
