/**
 * @name KeywordPing
 * @version 1.1.0
 * @description Pings you when a specific keyword is mentioned in chat, requiring an exact match by length and content. Compatible with BetterDiscord and Vencord.
 * @author Tj
 */

module.exports = (() => {
    const config = {
        info: {
            name: "KeywordPing",
            version: "1.1.0",
            description: "Pings you only when a specific keyword (matching exactly by length and content) is mentioned.",
            author: "Tj",
        },
        defaultSettings: {
            keyword: "hello"
        },
    };

    const isBetterDiscord = typeof BdApi !== "undefined";
    const isVencord = typeof VencordApi !== "undefined";
    const PluginApi = isBetterDiscord ? BdApi : isVencord ? VencordApi : null;

    if (!PluginApi) {
        return class {
            load() { alert("Error: This plugin requires BetterDiscord or Vencord."); }
            start() { this.load(); }
            stop() {}
        };
    }

    return (([Plugin, Library]) => {
        const { Patcher, WebpackModules, PluginUtilities, DiscordModules } = Library;
        
        return class KeywordPing extends Plugin {
            constructor() {
                super();
                this.settings = PluginUtilities.loadSettings(config.info.name, config.defaultSettings);
            }

            onStart() {
                this.patchMessages();
                PluginApi.showToast(`${config.info.name} started!`, { type: "info" });
            }

            onStop() {
                Patcher.unpatchAll();
                PluginApi.showToast(`${config.info.name} stopped!`, { type: "info" });
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
                PluginApi.showToast(`Keyword "${this.settings.keyword}" mentioned!`, { type: "info" });

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
                const SettingsPanel = isBetterDiscord ? BdApi.Settings.Panel : VencordApi.SettingsPanel;
                const Textbox = isBetterDiscord ? BdApi.Settings.Textbox : VencordApi.Settings.Textbox;

                return SettingsPanel({
                    children: [
                        Textbox("Keyword", "Enter the exact keyword to watch for.", this.settings.keyword, (val) => {
                            this.settings.keyword = val;
                            PluginUtilities.saveSettings(config.info.name, this.settings);
                        })
                    ]
                });
            }
        };
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
