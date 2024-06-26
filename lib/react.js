import {
    BLOCKED_WORDS,
    BOT_USERNAME,
    CHANNEL_NAME,
    ECONOMY_ENABLED,
    LEVELS_DISABLED,
    LINK_PROTECTION_ENABLED,
    SQUIRT_ENABLED,
    SUPER_MOD
} from '../src/constants';
import * as tools from '../src/tools';
import * as econ from './cmds/economy.js';
import * as misc from './cmds/misc.js';
import {
    db
} from './db.js';
var colors = require('colors');

var version = "1.5.3";
var warning_timers = [1, 5, 60];
var permitted = "";
var curr = "¥";
var perm_time;
var raffle_time = 0;
var joined = [];

export function add_user(user) {
    if (user) {
        db.run("INSERT OR IGNORE INTO users (UserID, UserName) VALUES (?, ?)",
            user['user-id'], user.username);
    }
}

export async function perform(channel, user, cmd, args, client) {
    //update coin count for user and check message count
    update_records(channel, user);
    check_activity(channel, user, client);


    if (!automod(user, cmd, args, channel, client, permitted, perm_time)) {

        

        //Moderator commands
        if (user.mod == true || channel.substring(1) == user.username) {
            if (cmd === '!warn') {
                warn(channel, user, cmd, args, client);
            }

            if (cmd === '!rmwarn') {
                rmwarn(channel, user, cmd, args, client);
            }

            if (cmd === '!permit') {
                permitted = args[0];
                perm_time = Date.now() + 60000;
            }

            if (cmd === "!remind") {
                misc.remind(channel, user, cmd, args, client);
            }
        }



        //Easter Egg Commands
        if (cmd === '!kels' || cmd === '!kelswie') {
            client.say(channel, '/me has a noahj body pillow :skull:');
        }

        if (cmd === '!quest') {
            misc.quest(channel, client);
        }

        if (cmd === '!xemphas') {
            misc.xemphas(channel, client);
        }

        if (cmd === '!rosie') {
            misc.rosie(channel, client);
        }


        //Miscellaneous Commands
        if(SQUIRT_ENABLED.includes(channel.substring(1))){
            if (cmd === '!squirt') {
            misc.squirt(channel, user, cmd, args, client);
            }    
        }

        //joins raffles for channels with streamelements cuz im a whore for the money
        if (cmd === '!sraffle' || cmd === '!raffle') {

            if (user.mod == true || user.username == channel.substring(1)) {
                await tools.sleep(Math.floor(Math.random() * 22000) + 3005);
                client.say(channel, '!join');
            }
        }
        
        if (cmd === "!bonk" || cmd === "!hit") {
            misc.hit(channel, user, cmd, args, client);
        }

        if (cmd === '!about')
        {
            client.say(channel,
                `/me The official INTERYON Twitch Bot. Developed by interyon. interyPOP ${version}`);
        }

        if (cmd === '!level' && !LEVELS_DISABLED.includes(channel.substring(1))){
            misc.level(channel, user, cmd, args, client);
        }


        //Economy Commands
        if (ECONOMY_ENABLED.includes(channel.substring(1))) {

            if (SUPER_MOD.includes(user.username)) {
                if (cmd === '!add' || cmd === "!addpoints") {
                    econ.addpoints(channel, user, cmd, args, client);
                }

                if (cmd === "!set" || cmd === "!setpoints") {
                    econ.setpoints(channel, user, cmd, args, client);
                }
            }

            //raffle
            if (user.mod == true || channel.substring(1) == user.username || user.username == "interyon") {
                if (cmd === '!raffle' && Date.now() > raffle_time) {
                    var amnt;
                    raffle_time = Date.now() + 30000;
                    console.log(`Starting Raffle`.green);
                    if (!isNaN(parseInt(args[0]))) {
                        var amnt;
                        if (args[0][args[0].length - 1] == 'k') {
                            amnt = parseInt(args[0], 10) * 1000;
                        } else if (args[0][args[0].length - 1] == 'm') {
                            amnt = parseInt(args[0], 10) * 1000000;
                        } else if (args[0][args[0].length - 1] == 'b') {
                            amnt = parseInt(args[0], 10) * 1000000000;
                        } else {
                            amnt = parseInt(args[0], 10);
                        }
                        if (amnt < 0) {
                            amnt *= -1;
                        }
                    } else {
                        amnt = 500;
                    }
                    client.say(
                        channel,
                        `/me interyPOP A Raffle has begun for ${curr}${tools.intFormat(amnt)} interyPOP it will end in 30 seconds. Enter by typing !join FeelsGoodMan`
                    );
                    await tools.sleep(7500);
                    client.say(
                        channel,
                        `/me The Raffle for ${curr}${tools.intFormat(amnt)} will end in 22 seconds. Enter by typing !join FeelsGoodMan`
                    );
                    await tools.sleep(7500);
                    client.say(
                        channel,
                        `/me The Raffle for ${curr}${tools.intFormat(amnt)} will end in 15 seconds. Enter by typing !join FeelsGoodMan`
                    );
                    await tools.sleep(7500);
                    client.say(
                        channel,
                        `/me The Raffle for ${curr}${tools.intFormat(amnt)} will end in 7 seconds. Enter by typing !join FeelsGoodMan`
                    );
                    await tools.sleep(7500);
                    econ.raffle(joined, amnt, cmd, channel, client);
                    raffle_time = 0;
                    joined.length = 0;
                }
            }

            if (cmd === '!join' && Date.now() < raffle_time) {
                joined.push(user.username);
            }


            if (cmd === '!coins' ||
                cmd === '!points' ||
                cmd === '!yen') {
                econ.return_coins(channel, user, cmd, args, client);
            }

            if (cmd === '!bid' ||
                cmd === '!bet' ||
                cmd === '!gamble' ||
                cmd === '!flip') {
                econ.gamble(channel, user, cmd, args, client);
            }

            if (cmd === "!givepoints" || cmd === "!give") {
                econ.givepoints(channel, user, cmd, args, client);
            }
        }
    }
}

function automod(user, cmd, args, channel, client, permitted, time) {
    let shouldSendMessage = false;
    if (user.username === BOT_USERNAME || CHANNEL_NAME.includes(`#` + user.username) || user.mod == true) {
        return shouldSendMessage;
    }

    //check message

    shouldSendMessage = BLOCKED_WORDS.some(blockedWord =>
        args.includes(blockedWord.toLowerCase()));

    //delete message
    if (shouldSendMessage || BLOCKED_WORDS.some(blockedWord => cmd.includes(blockedWord.toLowerCase()))) {
        shouldSendMessage = true;
        client.say(channel, `/timeout ${user.username} 5 bad word`);
    }

    var phrase = cmd + " " + args.join(" ");
    var matches = phrase.match(/(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi);
    var botspam_buysubs = phrase.match(/( *b *u *y *(t *w *i *t *c *h)?( *f *o *l *l *o *w| *s *u *b(?!n)| *v *i *e *w| *p *r *i *m *e)(.+?( *f *o *l *l *o *w| *s *u *b| *v *i *e *w| *p *r *i *m *e))*(.+)?( *b *i *g *f *o *l *l *o *w *s)?)/gim);

    if (botspam_buysubs){
        client.say(channel, `/timeout ${user.username} 5 bot`);
        shouldSendMessage = true;
    }

    if (user.username == permitted && Date.now() < time) {
        return shouldSendMessage;
    }

    if (matches) {
        if (LINK_PROTECTION_ENABLED.includes(channel.substring(1))){
            if (matches.length == 1) {
                if (matches[0].includes('clips.twitch.tv')) {
                    return shouldSendMessage;
                }
            }
            client.say(channel, `/timeout ${user.username} 5 no links! (!permit <user> to whitelist)`);
            shouldSendMessage = true;    
        }
    }
    return shouldSendMessage;
}

function update_records(channel, user) {
    

    db.run("UPDATE users SET UserName = ?, MessagesSent = MessagesSent + 1, Coins = Coins + ? WHERE UserID = ?",
        user.username, Math.floor(Math.random() * 4), user['user-id']);
}

function check_activity(channel, user, client) {
    db.get("SELECT MessagesSent FROM users WHERE UserID = ?", user['user-id'], (err, row) => {
        if (err || row == undefined) {
            return;
        }
        var count = row.MessagesSent;
    });
}

function warn(channel, user, cmd, args, client, automod) {
    if (automod == null) {
        if (`#${user.username}` === channel || user.mod === true) {
            if (!args[0]) {
                client.say(channel,
                    `Must specify a target`
                );
            } else {
                let target = args.shift();
                if (target[0] == '@') {
                    target = target.substring(1);
                }
                console.log(`${target}`);
                let reason = args.join(' ');
                var warnings;

                new Promise(resolve => {
                    db.get("SELECT Warnings FROM users WHERE UserName = ?",
                        target, (err, row) => {
                            if (err) {
                                client.say(channel,
                                    `${target} has not typed in chat`
                                );
                                console.log(`exit on error 1: ${err.message}`.red);
                                return;
                            } else {
                                try {
                                    warnings = row.Warnings;
                                    resolve(warnings);
                                } catch (err) {
                                    client.say(channel,
                                        `undefined user`
                                    );
                                    console.log(`exit on error 2: undefined user`.red);
                                    return;
                                }
                            }
                        });
                }).then((warnings) => {
                    if (warnings < warning_timers.length) {
                        let tot = warning_timers[warnings]; //tot = time out time
                        client.say(channel,
                            `/timeout ${target} ${tot}m`
                        );
                        client.say(channel,
                            `${target}, you have been muted for the following reason: ${reason}. You will be unmuted in ${tot} minute(s)`
                        );
                        console.log(`${target} timed out for ${tot}m in ${channel} for ${reason}\n
            ${target} now has ${warnings} warnings`.green);

                        db.run("UPDATE users SET Warnings = Warnings + 1 WHERE UserName = ?", target);
                    } else {
                        client.say(channel,
                            `/ban ${target} repeat infractions`
                        );
                        client.say(channel,
                            `${target}, you have been banned for repeat infractions`
                        );
                        console.log(`${target} banned in ${channel}`.green);
                    }
                });
            }
        }
    } else {
        let target = user.username;
        let reason = 'use of a blocked word';
        var warnings;

        new Promise(resolve => {
            db.get("SELECT Warnings FROM users WHERE UserName = ?",
                target, (err, row) => {
                    if (err) {
                        client.say(channel,
                            `${target} has not typed in chat`
                        );
                        console.log(`exit on error 1: ${err.message}`.red);
                        return;
                    } else {
                        try {
                            warnings = row.Warnings;
                            resolve(warnings);
                        } catch (err) {
                            client.say(channel,
                                `undefined user`
                            );
                            console.log(`exit on error 2: undefined user`.red);
                            return;
                        }
                    }
                });
        }).then((warnings) => {
            if (warnings < warning_timers.length) {
                let tot = warning_timers[warnings]; //tot = time out time
                client.say(channel,
                    `/timeout ${target} ${tot}m`
                );
                client.say(channel,
                    `${target}, you have been muted for the following reason: ${reason}. You will be unmuted in ${tot} minute(s)`
                );
                console.log(`${target} timed out for ${tot}m in ${channel} for ${reason}\n
        ${target} now has ${warnings} warnings`.green);

                db.run("UPDATE users SET Warnings = Warnings + 1 WHERE UserName = ?", target);
            } else {
                client.say(channel,
                    `/ban ${target} repeat infractions`
                );
                client.say(channel,
                    `${target}, you have been banned for repeat infractions`
                );
                console.log(`${target} banned in ${channel}`.green);
            }
        });
    }

    console.log(`* Executed ${cmd} command`.green);
}

function rmwarn(channel, user, cmd, args, client) {
    if (`#${user.username}` === channel || user.mod === true) {
        if (!args[0]) {
            client.say(channel,
                `Must specify a target`
            );
        } else {
            let target = args.shift();
            if (target[0] == '@') {
                target = target.substring(1);
            }
            var warnings;
            new Promise(resolve => {
                db.get("SELECT Warnings FROM users WHERE UserName = ?",
                    target, (err, row) => {
                        if (err) {
                            client.say(channel,
                                `${target} has not typed in chat`
                            );
                            console.log(`exit on error 1: ${err.message}`.red);
                            return;
                        } else {
                            try {
                                warnings = row.Warnings;
                                resolve(warnings);
                            } catch (err) {
                                client.say(channel,
                                    `undefined user`
                                    );
                                console.log(`exit on error 2: undefined user`.red);
                                return;
                            }
                        }
                            
                    });
            }).then((warnings) => {
                if (warnings === 0) {
                    client.say(channel,
                        `${target} has 0 warnings`);
                } else {
                    db.run("UPDATE users SET Warnings = Warnings - 1 WHERE UserName = ?", target);
                    client.say(channel,
                        `/untimeout ${target}`
                    );
                    client.say(channel,
                        `Warning for ${target} revoked.`
                    );
                    console.log(`Removed warning for ${target}: ${warnings - 1}`.green);
                }
            });
        }
    }
    console.log(`* Executed ${cmd} command`.green);
}