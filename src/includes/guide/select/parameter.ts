import { InputStep, MultiStepInput } from "../../utils/multiStepInput";
import { BaseQuickPickGuide }        from "../base/pick";
import { QuickPickItem }             from "vscode";
import { State }                     from "../base/base";
import { ExtensionSetting }          from "../../settings/extension";
import { VSCodePreset }              from "../../utils/base/vscodePreset";
import { Constant }                  from "../../constant";
import { File }                      from "../../utils/base/file";
import { Optional }                  from "../../utils/base/optional";
import * as Wallpaper                from "../select/wallpaper";
import * as Slide                    from "../slide";

export class SelectParameterType extends BaseQuickPickGuide {
	private templateItems:       QuickPickItem[];
	private imageId:             string;
	private slideId:             string;
	private opacityId:           string;
	private slideIntervalId:     string;
	private slideIntervalUnitId: string;
	private slideRandomPlayId:   string;
	private slideEffectFadeInId: string;

	constructor(
		state: State,
	) {
		state.placeholder = "Select the item you want to set.";

		super(state);

		this.templateItems       = [
			VSCodePreset.create(VSCodePreset.Icons.fileMedia, "Image Path",            "Set the image to be used as the wallpaper."),
			VSCodePreset.create(VSCodePreset.Icons.folder,    "Image Files Path",      "Set the images to be used as the slide."),
			VSCodePreset.create(VSCodePreset.Icons.eye,       "Opacity",               "Set the opacity of the wallpaper."),
			VSCodePreset.create(VSCodePreset.Icons.clock,     "Slide Interval",        "Set the slide interval."),
			VSCodePreset.create(VSCodePreset.Icons.law,       "Slide Interval's Unit", "Set the slide interval's unit."),
			VSCodePreset.create(VSCodePreset.Icons.merge,     "Slide Random Playback", "set whether to play the slides randomly."),
			VSCodePreset.create(VSCodePreset.Icons.foldDown,  "Effect Fade in",        "set whether to use fade in effect."),
			VSCodePreset.create(VSCodePreset.Icons.save,      "Save",                  "Save changes."),
			VSCodePreset.create(VSCodePreset.Icons.mailReply, "Return",                "Return without saving any changes."),
		];
		this.imageId             = this.getId(ExtensionSetting.propertyIds.filePath);
		this.slideId             = this.getId(ExtensionSetting.propertyIds.slideFilePaths);
		this.opacityId           = this.getId(ExtensionSetting.propertyIds.opacity);
		this.slideIntervalId     = this.getId(ExtensionSetting.propertyIds.slideInterval);
		this.slideIntervalUnitId = this.getId(ExtensionSetting.propertyIds.slideIntervalUnit);
		this.slideRandomPlayId   = this.getId(ExtensionSetting.propertyIds.slideRandomPlay);
		this.slideEffectFadeInId = this.getId(ExtensionSetting.propertyIds.slideEffectFadeIn);
	}

	public async show(input: MultiStepInput): Promise<void | InputStep> {
		this.items = [
			this.templateItems[0],
			this.templateItems[1],
			this.templateItems[2],
			this.templateItems[3],
			this.templateItems[4],
			this.templateItems[5],
			this.templateItems[6]
		].concat(
			Object.keys(this.state.resultSet).length > 0
				? this.templateItems[7]
				: []
		).concat(this.templateItems[8]);

		await super.show(input);
	}

	public async after(): Promise<void> {
		let optional = new Optional();

		switch (this.activeItem) {
			case this.templateItems[0]:
				this.state.inputResult = optional.set(this.state.resultSet[this.itemId]).orElse(this.settings.filePath);
				this.setNextSteps([{ key: "ImageFilePathGuide",     state: { title: this.title + " - Image Path",            guideGroupId: this.guideGroupId }}]);
				break;
			case this.templateItems[1]:
				this.setNextSteps([{ key: "SlideFilePathsGuide",    state: { title: this.title + " - Image Files Path",      guideGroupId: this.guideGroupId }}]);
				break;
			case this.templateItems[2]:
				this.state.inputResult = optional.set(this.state.resultSet[this.opacityId]).orElse(this.settings.opacity);
				this.setNextSteps([{ key: "OpacityGuide",           state: { title: this.title + " - Opacity",               guideGroupId: this.guideGroupId }}]);
				break;
			case this.templateItems[3]:
				this.state.inputResult = optional.set(this.state.resultSet[this.slideIntervalId]).orElse(this.settings.slideInterval);
				this.setNextSteps([{ key: "SlideIntervalGuide",     state: { title: this.title + " - Slide Interval",        guideGroupId: this.guideGroupId }}]);
				break;
			case this.templateItems[4]:
				this.state.activeItem  =
					optional.set(this.state.resultSet[this.slideIntervalUnitId])
					.orElse(
						Constant.slideIntervalUnit.find(
							(item) => {
								return item.label === this.settings.slideIntervalUnit;
							}
						)
					);
				this.setNextSteps([{ key: "BaseQuickPickGuide",     state: Object.assign({ title: this.title + " - Slide Interval Unit",   guideGroupId: this.guideGroupId }, Slide.getDefaultState(ExtensionSetting.propertyIds.slideIntervalUnit)) }]);
				break;
			case this.templateItems[5]:
				this.state.activeItem  =
					optional.set(this.state.resultSet[this.slideRandomPlayId])
					.orElse(
						this.settings.slideRandomPlay ? Constant.slideRandomPlay[0] : Constant.slideRandomPlay[1]
					)
				this.setNextSteps([{ key: "SlideRandomPlayGuide",   state: { title: this.title + " - Slide Random Playback", guideGroupId: this.guideGroupId }}]);
				break;
			case this.templateItems[6]:
				this.state.activeItem  =
					optional.set(this.state.resultSet[this.slideEffectFadeInId])
					.orElse(
						this.settings.slideEffectFadeIn ? Constant.slideEffectFadeIn[0] : Constant.slideEffectFadeIn[1]
					)
				this.setNextSteps([{ key: "BaseQuickPickGuide",     state: Object.assign({ title: this.title + " - Slide Effect Fade In",  guideGroupId: this.guideGroupId }, Slide.getDefaultState(ExtensionSetting.propertyIds.slideEffectFadeIn)) }]);
				break;
			case this.templateItems[7]:
				await this.save();
				break;
			default:
				this.prev();
				break;
		}
	}

	private async save(): Promise<void> {
		if (this.state.resultSet) {
			await this.registImageFilePath();
			await this.registSlideFilePaths();
			await this.registOpacity();
			await this.registSlideIntervalUnit();
			await this.registSlideInterval();
			await this.registSlideRandomPlay();
			await this.registSlideEffectFadeIn();
		}

		Wallpaper.delegation2Transition(this, this.installer, this.settings, this.state);
	}

	private async registImageFilePath(): Promise<void> {
		if (this.state.resultSet[this.imageId]) {
			await this.settings.set(ExtensionSetting.propertyIds.filePath, this.state.resultSet[this.imageId]);
		}
	}

	private async registSlideFilePaths(): Promise<void> {
		if (this.state.resultSet[this.slideId]) {
			await this.settings.set(
				ExtensionSetting.propertyIds.slideFilePaths,
				File.getChldrens(
					this.state.resultSet[this.slideId],
					{
						filters:   Constant.applyImageFile,
						fullPath:  true,
						recursive: false,
					}
				)
			);
		}
	}

	private async registOpacity(): Promise<void> {
		if (typeof(this.state.resultSet[this.opacityId]) === "string") {
			if (this.state.resultSet[this.opacityId].length > 0) {
				await this.settings.set(
					ExtensionSetting.propertyIds.opacity,
					Number(this.state.resultSet[this.opacityId])
				);
			} else {
				await this.settings.remove(ExtensionSetting.propertyIds.opacity);
			}
		}
	}

	private async registSlideIntervalUnit(): Promise<void> {
		if (this.state.resultSet[this.slideIntervalUnitId]) {
			await this.settings.set(
				ExtensionSetting.propertyIds.slideIntervalUnit,
				this.state.resultSet[this.slideIntervalUnitId].label
			);
		}
	}

	private async registSlideInterval(): Promise<void> {
		if (typeof(this.state.resultSet[this.slideIntervalId]) === "string") {
			if (this.state.resultSet[this.slideIntervalId].length > 0) {
				await this.settings.set(
					ExtensionSetting.propertyIds.slideInterval,
					Number(this.state.resultSet[this.slideIntervalId])
				);
			} else {
				await this.settings.remove(ExtensionSetting.propertyIds.slideInterval);
			}
		}
	}

	private async registSlideRandomPlay(): Promise<void> {
		if (this.state.resultSet[this.slideRandomPlayId]) {
			if (this.state.resultSet[this.slideRandomPlayId] === Constant.slideRandomPlay[0]) {
				await this.settings.set(ExtensionSetting.propertyIds.slideRandomPlay, true);
			} else {
				await this.settings.remove(ExtensionSetting.propertyIds.slideRandomPlay);
			}
		}
	}

	private async registSlideEffectFadeIn(): Promise<void> {
		if (this.state.resultSet[this.slideEffectFadeInId]) {
			if (this.state.resultSet[this.slideEffectFadeInId] === Constant.slideEffectFadeIn[0]) {
				await this.settings.remove(ExtensionSetting.propertyIds.slideEffectFadeIn);
			} else {
				await this.settings.set(ExtensionSetting.propertyIds.slideEffectFadeIn, false);
			}
		}
	}
}
