import { ExtensionSetting } from "../settings/extension";
import { ContextManager }   from "../utils/base/context";
import * as Constant        from "../constant";
import { formatByArray }    from "../utils/base/string";
import { File }             from "../utils/base/file";

type Ready   = { image: boolean, slide: boolean };
type AutoSet = number;

const imageChangeScript         = `const changeImage=(async(imageData)=>{{0}document.body.style.backgroundImage=imageData;{1}});`;
const feedInScript1             = `const sleep=(ms)=>{return new Promise((resolve,reject)=>{setTimeout(resolve,ms);});};const feedin=(async(opacity,decrement,ms)=>{let current=1;while(current>opacity){current-=decrement;document.body.style.opacity=current;await sleep(ms);};document.body.style.opacity={0};});document.body.style.opacity=1;`;
const feedInScript2             = `await feedin({0},0.01,50);`;
const feedInScript1WithAdvanced = `const sleep=(ms)=>{return new Promise((resolve,reject)=>{setTimeout(resolve,ms);});};const feedin=(async(start,increment,ms)=>{let current=start;while(current<1){current+=increment;document.body.style.backdropFilter="brightness("+current+")";await sleep(ms);}});`;
const feedInScript2WithAdvanced = `await feedin(0,0.01,50);`;

export abstract class AbstractWallpaper {
	private destination:    string;
	private settings:       ExtensionSetting;
	private extensionKey:   string;
	private previous:       string;
	private isAdvancedMode: boolean;
	private _isInstall:     boolean;
	private _isReady:       undefined | Ready;
	private _isAutoSet:     undefined | AutoSet;

	constructor(
		destination:  string,
		settings:     ExtensionSetting,
		extensionKey: string
	) {
		this.destination    = destination;
		this.settings       = settings;
		this.extensionKey   = extensionKey;
		this.previous       = '';
		this.isAdvancedMode = this.settings.isAdvancedMode;
		this._isInstall     = this.checkIsInstall();
		this._isReady       = this.checkIsReady();
		this._isAutoSet     = this.checkIsAutoSet();
	}

	protected checkIsInstall(): boolean {
		return this.getCurrentScript() ? true : false;
	}

	protected checkIsReady(): undefined | Ready {
		const image = this.settings.filePath.value.length > 0;
		const slide = this.settings.slideFilePaths.value.length > 0;

		if (image || slide) {
			return { "image": image, "slide": slide };
		} else {
			return undefined;
		}
	}

	protected checkIsAutoSet(): undefined | AutoSet {
		let checkResult: undefined | AutoSet = undefined;

		if (this.isReady) {
			if (this.isReady.image && !this.isReady.slide) {
				checkResult = Constant.wallpaperType.Image;
			} else if (!this.isReady.image && this.isReady.slide) {
				checkResult = Constant.wallpaperType.Slide;
			}
		}

		return checkResult;
	}

	public get isInstall(): boolean {
		return this._isInstall;
	}

	public get isReady(): undefined | Ready {
		return this._isReady;
	}

	public get isAutoSet(): undefined | AutoSet {
		return this._isAutoSet;
	}

	public install(fromSync?: boolean, syncData?: string, syncOpacity?: number): void {
		const editFile   = new File(this.destination);
		let   image      = "";
		let   opacity    = undefined;

		if (
			fromSync                                              &&
			syncData    && syncData.length > 0                    &&
			syncOpacity && syncOpacity >= Constant.maximumOpacity
		) {
			image        = syncData;
			opacity      = syncOpacity;
		} else if (this.settings.filePath.value) {
			const file   = new File(this.settings.filePath.value,);
			image        = `data:image/${file.extension};base64,${file.toBase64()}`
			opacity      = this.settings.opacity.validValue;
		}

		editFile.content = this.clearWallpaperScript(editFile.toString()) + this.getWallpaperScript(image, opacity);

		editFile.write();
	}

	public installAsSlide(): void {
		const editFile   = new File(this.destination);

		editFile.content =
			this.clearWallpaperScript(editFile.toString()) +
			this.getSlideScript(
				this.settings.slideFilePaths.value,
				this.settings.opacity.validValue,
				this.settings.slideIntervalUnit2Millisecond,
				this.settings.slideRandomPlay.validValue,
				this.settings.slideEffectFadeIn.validValue
			);

		editFile.write();
	}

	public installWithPrevious(): void {
		const editFile   = new File(this.destination);

		editFile.content = this.clearWallpaperScript(editFile.toString()) + this.previous;

		editFile.write();
	}

	public uninstall(): void {
		const editFile   = new File(this.destination);

		editFile.content = this.clearWallpaperScript(editFile.toString());

		editFile.write();
	}

	public holdScriptData(): void {
		this.previous = this.getCurrentScript();
	}

	protected getCurrentScript(): string {
		const data = new File(this.destination).toString().match(this.getScriptMatch());

		return data ? data[0] : "";
	}

	protected getWallpaperScript(image: string, opacity: number): string {
		let result = "";

		if (image && opacity) {
			result = formatByArray(
				this.getScriptTemplate(opacity),
				`document.body.style.backgroundImage='url("${image}")';`
			);
		}

		return result;
	}

	protected getSlideScript(
		filePaths: Array<string>,
		opacity:   number,
		interval:  number,
		random:    boolean,
		feedin:    boolean
	): string {
		let result = "";

		if (filePaths.length > 0 && opacity && interval) {
			const [script1, script2] = feedin ? this.getFeedInScript(opacity) : [``, ``];

			let   temp               = `let images=new Array();`;

			filePaths.forEach((filePath) => {
				const image = new File(filePath);
				temp        += `images.push('url("data:image/${image.extension};base64,${image.toBase64()}")');`;
			});

			temp    += formatByArray(imageChangeScript, script1, script2);
			temp    += this.getRandomOrNormalScript(random);
			temp    += `setInterval((async()=>{i=choice(0,images.length-1);changeImage(images[i]);after(i);}),${interval});`;

			result  =  formatByArray(this.getScriptTemplate(opacity), temp);
		}

		return result;
	}

	private getFeedInScript(opacity: number): [script1: string, script2: string] {
		if (this.isAdvancedMode) {
			return [
				feedInScript1WithAdvanced,
				feedInScript2WithAdvanced,
			];
		} else {
			return [
				formatByArray(feedInScript1, opacity.toString()),
				formatByArray(feedInScript2, opacity.toString()),
			];
		}
	}

	protected getScriptTemplate(opacity: number): string {
		let result = `/*${this.extensionKey}-start*/
/*${this.extensionKey}.ver.${ContextManager.version}*/
window.onload=()=>{`;
		result     += `const style=document.createElement("style");`;
		result     += `style.appendChild(document.createTextNode("` + this.getBasicStyle(opacity) + `"));`
		result     += `document.head.appendChild(style);`;
		result     += `{0}`;
		result     += `}
/*${this.extensionKey}-end*/`;

		return result;
	}

	protected getBasicStyle(opacity: number): string {
		let style = ``;
		style += `body > div {background-color:transparent !important;}`;
		style += `body {`;
		style += this.isAdvancedMode ? `` : `opacity:${opacity};`
		style += `background-size:cover;`
		style += `background-position:center;`;
		style += `background-repeat:no-repeat;`;
		style += `}`;

		return style;
	}

	protected clearWallpaperScript(content: string): string {
		return content.replace(this.getScriptMatch(), "");
	}

	protected getScriptMatch(): RegExp {
		return new RegExp(
			"\\/\\*" + this.extensionKey + "-start\\*\\/[\\s\\S]*?\\/\\*" + this.extensionKey + "-end\\*\\/",
			"g"
		);
	}

	protected getRandomOrNormalScript(random: boolean): string {
		let result = "";
		if (random) {
			result += `let played=new Array();let i=0;`;
			result += `const choice=(min,max)=>{return Math.floor(Math.random()*(max-min+1))+min;};`;
			result += `const after=(index)=>{played.push(images[index]);images.splice(index,1);if(images.length===0){images=played;played=new Array();}};`;
			result += `i=choice(0,images.length-1);`;
			result += `document.body.style.backgroundImage=images[i];after(i);`;
		} else {
			result += `let i=0;`;
			result += `const choice=(min,max)=>{i++; return i===max?min:i;};`
			result += `const after=(index)=>{return;};`;
			result += `document.body.style.backgroundImage=images[i];`;
		}

		return result;
	}
}