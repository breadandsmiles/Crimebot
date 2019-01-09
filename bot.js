const Discord = require('discord.js')
const { Client, Util } = require('discord.js');
const { PREFIX } = require('./config');
const {  GOOGLE_API_KEY } = require(process.env.GOOGLE_API_KEY)
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => {
	console.log('Tao online rồi');
	client.user.setStatus('available')
	client.user.setPresence({
		game: {
			name: '435456',
			type: "PLAYING"
		}
	})
});

client.on('disconnect', () => console.log('tao vừa bị disconnected, tao sẽ quay trở lại!'));

client.on('reconnecting', () => console.log('Tao đang quay trở lại'));

client.on('message', async message => {
	if (message.author.bot) return undefined;
	if (!message.content.startsWith(PREFIX)) return undefined;

	const args = message.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(message.guild.id);

	let command = message.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)

	let argr2 = message.content.slice(PREFIX.length).trim().split(' ');
	let _say_ = argr2.shift().toLowerCase();
	if(message.content.startsWith(PREFIX + "say")) {
		let say = argr2.join(' ');
		message.delete();
		message.channel.send(say);
	}
	if(message.content.startsWith(PREFIX + "lenny")){
		message.delete();
		message.channel.send("(˵ ͡° ͜ʖ ͡°˵)");
	}
	if(message.content.startsWith(PREFIX + "ping")) {
		let tosend = ['```xl','PING đang lag sml:',`${client.ping} ms`,'```'];
		message.channel.send(tosend.join('\n'));
	};
	if (message.content.startsWith(PREFIX+ "avatar")) {
        let user = message.mentions.users.first() || message.author;
        let embed = new Discord.RichEmbed()
        .setAuthor(`${user.tag}`)
        .setImage(user.avatarURL)
        .setColor('RANDOM')
		message.channel.send(embed)
	};
	
	if(message.content.startsWith(PREFIX + "kick")) {
		let user = message.mentions.users.first();
        if (user) {
            let member = message.guild.member(user);
            if (member) {
                member.kick('Optional reason that will display in the audit logs').then(() =>{
                    message.reply(`đã cho ${user.tag} ra đảo `);
                }).catch(err =>{
                    message.reply('em không kick được nó');
                    console.error(err);
                });
            } else {
                message.reply('thằng này tao không biết!');
            }   
        } else {
            message.reply('giáo sư chưa chọn người để cho ra đảo!');
        }
	};
	if(message.content.startsWith(PREFIX + "join")) {
		return new Promise((resolve, reject) => {
			const voiceChannel = message.member.voiceChannel;
			if (!voiceChannel || voiceChannel.type !== 'voice') return message.reply('vào voice chát trước đi giáo sư');
			voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
			message.reply(" đã chui zo (˵ ͡° ͜ʖ ͡°˵) ")
		});
	};
	if (command === 'help') {
		let tosend = ['```xl','CHỨC NĂNG VOICE CHÁT', PREFIX + 'join : "vào voice chát"', PREFIX + 'Play : "tìm hoặc thêm link youtube"', PREFIX + 'list : "hiển thị danh sách."', PREFIX + 'np : "hiển thị bài hát đang gáy"', '', 'CÁC LỆNH KHI ĐANG PHÁT NHẠC:'.toUpperCase(), PREFIX + 'pause : "tạm dừng bài hát"',	PREFIX + 'resume : "tiếp tục bài hát"', PREFIX + 'skip : "bỏ qua bài hát"', PREFIX + 'stop : "thời gian đang phát bài hát."', PREFIX + 'volume : "âm lượng"','CÁC CHỨC LỆNH KHÁC', PREFIX + 'say : "bot nói"', PREFIX + 'lenny : "(˵ ͡° ͜ʖ ͡°˵)"',PREFIX + 'avatar:"xem avatar"',PREFIX + 'ping: "xem ping"',	'```'];
		message.channel.send(tosend.join('\n'));
	}
	if (command === 'play') {
		const voiceChannel = message.member.voiceChannel;
		if (!voiceChannel) return message.channel.send('vào voice chát trước đi giáo sư');
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) {
			return message.channel.send('em không vào được voi chát');
		}
		if (!permissions.has('SPEAK')) {
			return message.channel.send('gáy méo được (T.T)');
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return message.channel.send(`✅ Playlist: **${playlist.title}** đã được thêm vào danh sách`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					message.channel.send(`
__**Danh sách tìm kiếm:**__

${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}

Chọn 1 thứ bất kì trong danh sách.
					`);
					try {
						var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return message.channel.send('Không có hoặc giá trị được nhập không hợp lệ, hủy chọn video.');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return message.channel.send('🆘 e không tìm thấy gì cả');
				}
			}
			return handleVideo(video, message, voiceChannel);
		}
	} else if (command === 'skip') {
		if (!message.member.voiceChannel) return message.channel.send('thím đang không ở trong voice chát!');
		if (!serverQueue) return message.channel.send('không có gì để sờ kíp hết.');
		serverQueue.connection.dispatcher.end('đã skip!');
		return undefined;
	} else if (command === 'stop') {
		if (!message.member.voiceChannel) return message.channel.send('thím đang không ở trong voice chát!');
		if (!serverQueue) return message.channel.send('không có gì để sờ tốp.');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('đã stop!');
		return undefined;
	} else if (command === 'volume') {
		if (!message.member.voiceChannel) return message.channel.send('thím đang không ở trong voice chát!');
		if (!serverQueue) return message.channel.send('Không có gì để gáy.');
		if (!args[1]) return message.channel.send(`Âm lượng hiện tại là: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return message.channel.send(`Âm Lượng đã cài đặt là: **${args[1]}**`);
	} else if (command === 'np') {
		if (!serverQueue) return message.channel.send('Không có gì để gáy.');
		return message.channel.send(`🎶 Đang gáy: **${serverQueue.songs[0].title}**`);
	} else if (command === 'list') {
		if (!serverQueue) return message.channel.send('không có gì để gáy.');
		return message.channel.send(`
__**Danh sách:**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Đang gáy:** ${serverQueue.songs[0].title}
		`);
	} else if (command === 'pause') {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return message.channel.send('⏸ tạm dừng');
		}
		return message.channel.send('không có gì để gáy.');
	} else if (command === 'resume') {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return message.channel.send('▶ tiếp tục');
		}
		return message.channel.send('không có gì để gáy.');
	}

	return undefined;
});

async function handleVideo(video, message, voiceChannel, playlist = false) {
	const serverQueue = queue.get(message.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(message.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(message.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`Em không vào được voice chát: ${error}`);
			queue.delete(message.guild.id);
			return message.channel.send(`Em không vào được voice chát: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return message.channel.send(`✅ **${song.title}** đã được thêm vào danh sách!`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 Bắt Đầu Gáy: **${song.title}**`);
};


client.login(process.env.BOT_TOKEN);
