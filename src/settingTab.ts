import { App, Notice, PluginSettingTab, Setting, TFolder } from "obsidian";
import WeChatPublic from "../main";
import { settingsStore } from "./settings";
import ApiManager from "./api";
import { get } from "svelte/store";
import pickBy from "lodash.pickby";

export class WeChatPublicSettingTab extends PluginSettingTab {
	plugin: WeChatPublic;
	private apiManager: ApiManager;
	readonly expireDuration: number = 7200;

	constructor(app: App, plugin: WeChatPublic, apiManeger: ApiManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.apiManager = apiManeger;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		new Setting(containerEl)
			.setName("🌈 Wechat public platform")
			.setHeading();
		if (
			get(settingsStore).lastAccessKeyTime + this.expireDuration <
			new Date().getTime()
		) {
			this.showWxLogin();
		} else {
			this.showWxLogout();
		}

		this.setAppId();
		this.setSecret();
		this.setDownloadFolder();
		this.setBlacklist();
		this.setNoteLocationFolder();
	}

	private showWxLogout(): void {
		document.createRange().createContextualFragment;
		const desc = document
			.createRange()
			.createContextualFragment(
				`If you want to clean secret,please click at clean secret`
			);

		new Setting(this.containerEl)
			.setName(
				`Wechat platform haved login, APP-ID: ${
					get(settingsStore).appid
				}`
			)
			.setDesc(desc)
			.addButton((button) => {
				return button
					.setButtonText("Clean secret")
					.setCta()
					.onClick(async () => {
						button.setDisabled(true);
						settingsStore.actions.clearSecret();
						this.display();
					});
			})
			.addButton((button) => {
				return button
					.setButtonText("Copy access key")
					.setCta()
					.onClick(async () => {
						const accesskey = get(settingsStore).accessToken;
						navigator.clipboard.writeText(accesskey).then(
							function () {
								new Notice(
									"Copy access-key to clipboard succeed!"
								);
							},
							function (error) {
								new Notice(
									"Copy access-key to clipboard failed!"
								);
								console.error(
									"Copy access-key to clipboard failed!",
									error
								);
							}
						);
					});
			});
	}

	private showWxLogin(): void {
		const desc = document
			.createRange()
			.createContextualFragment(
				`Before the test, enter [appid] and [secretkey], and contact the administrator to whitelist your external IP address. https://tool.lu/ip/`
			);

		new Setting(this.containerEl)
			.setName("Test the wechat public API")
			.setDesc(desc)
			.addButton((button) => {
				return button
					.setButtonText("Connect")
					.setCta()
					.onClick(async () => {
						button.setDisabled(true);
						// reqest access token key
						await this.apiManager.refreshAccessToken(
							get(settingsStore).appid,
							get(settingsStore).secret
						);
						this.display();
					});
			});
	}

	private setAppId(): void {
		new Setting(this.containerEl)
			.setName("Setting appid")
			.setDesc("wechat public platform account appid")
			.addText((text) =>
				text
					.setPlaceholder("Enter your appid")
					.setValue(get(settingsStore).appid)
					.onChange(async (value) => {
						settingsStore.actions.setAppId(value);
					})
			);
	}

	private setSecret(): void {
		new Setting(this.containerEl)
			.setName("Setting secret")
			.setDesc("wechat public platform account secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(get(settingsStore).secret)
					.onChange(async (value) => {
						settingsStore.actions.setSecret(value);
					})
			);
	}

	private setNoteLocationFolder(): void {
		new Setting(this.containerEl)
			.setName("Note location folder")
			.setDesc("for future using")
			.addText((input) => {
				input
					.setPlaceholder("ur wechat release folder")
					.setValue(get(settingsStore).noteLocationFolder)
					.onChange((value: string) => {
						settingsStore.actions.setNoteLocationFolder(value);
					});
			});
	}

	private setDownloadFolder(): void {
		new Setting(this.containerEl)
			.setName("Download folder")
			.setDesc("Download folder from wechat public")
			.addDropdown((dropdown) => {
				const files = this.app.vault.getAllLoadedFiles();
				const folders = pickBy(files, (val: any) => {
					return val instanceof TFolder;
				});

				Object.values(folders).forEach((val: TFolder) => {
					dropdown.addOption(val.path, val.path);
				});

				return dropdown
					.setValue(get(settingsStore).downloadFolder)
					.onChange(async (value) => {
						settingsStore.actions.setDownloadFolder(value);
					});
			});
	}

	private setBlacklist(): void {
		new Setting(this.containerEl)
			.setName("Blacklist")
			.setDesc("Prohibit upload folders, use comma apart")
			.addText((input) => {
				input
					.setPlaceholder("/self,/key,/secret")
					.setValue(get(settingsStore).BlacklistFolder)
					.onChange((value: string) => {
						settingsStore.actions.setBlacklistFolder(value);
					});
			});
	}
}
