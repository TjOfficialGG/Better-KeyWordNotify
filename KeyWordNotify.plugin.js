/**
 * @name KeywordPing
 * @version 1.0.0
 * @description Pings you when a specific keyword is mentioned in chat, requiring an exact match by length and content.
 * @author Tj
 */

module.exports = (() => {
    const config = {
        info: {
            name: "KeywordPing",
            version: "1.0.0",
            description: "Pings you only when a specific keyword (matching exactly by length and content) is mentioned.",
            author: "Tj",
        },
        defaultSettings: {
            keyword: "hello"
        },
    };

    return !global.ZeresPluginLibrary ? class {
        load() { BdApi.alert("Library Missing", "Please install ZeresPluginLibrary for this plugin to work."); }
        start() { this.load(); }
        stop() {}
    } : (([Plugin, Library]) => {
        const { Patcher, WebpackModules, PluginUtilities, DiscordModules } = Library;
        
        return class KeywordPing extends Plugin {
            constructor() {
                super();
                this.settings = PluginUtilities.loadSettings(this.getName(), config.defaultSettings);
            }

            onStart() {
                this.patchMessages();
                BdApi.showToast(`${config.info.name} started!`, { type: "info" });
            }

            onStop() {
                Patcher.unpatchAll();
                BdApi.showToast(`${config.info.name} stopped!`, { type: "info" });
            }

            patchMessages() {
                const MessageEvents = WebpackModules.find(m => m?.default?.dispatch && m.default.subscribe);
                
                Patcher.before(MessageEvents, "default", (_, [event]) => {
                    if (event.type === "MESSAGE_CREATE") {
                        this.checkKeyword(event.message);
                    }
                });
            }

            checkKeyword(message) {
                const { keyword } = this.settings;
                if (message.content.length === keyword.length && message.content === keyword) {
                    this.pingUser(message);
                }
            }

            pingUser(message) {
                BdApi.showToast(`Keyword "${this.settings.keyword}" mentioned!`, { type: "info" });

                const channel = DiscordModules.ChannelStore.getChannel(message.channel_id);
                const chatMessage = `[KeywordPing] ${this.settings.keyword} mentioned by ${message.author.username} in #${channel.name}`;
                
                DiscordModules.MessageActions.receiveMessage(
                    channel.id, 
                    { 
                        author: { username: "KeywordPing" }, 
                        content: chatMessage, 
                        type: 0 
                    }
                );
            }

            getSettingsPanel() {
                return BdApi.React.createElement(
                    BdApi.Settings.Panel,
                    {
                        children: [
                            BdApi.Settings.Textbox("Keyword", "Enter the exact keyword to watch for.", this.settings.keyword, (val) => {
                                this.settings.keyword = val;
                                PluginUtilities.saveSettings(this.getName(), this.settings);
                            })
                        ]
                    }
                );
            }
        };
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
 
