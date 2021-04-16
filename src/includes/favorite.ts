import * as path            from "path";
import { ExtensionSetting } from "./settings/extension";
import { Wallpaper }        from "./wallpaper";

export async function randomSet() {
	let setting      = new ExtensionSetting();

	if (
		!(typeof(setting.isFavoriteExist) === "boolean") &&
		setting.favoriteRandomSet
	) {
		const type   = { Image: 0, Slide: 1 };
		const choice = (min: number, max: number) => {
			return Math.floor(Math.random() * (max - min + 1)) +min;
		};
		let installer                                     = new Wallpaper(
			(() => {
				let result: string | undefined;
	
				if (require.main?.filename) {
					result = require.main?.filename;
					console.debug('Use "require.main?.filename"');
				} else {
					result = process.mainModule?.filename;
					console.debug('Use "process.mainModule?.filename"');
				}
		
				return result ? path.dirname(result) : "";
			})(),
			"bootstrap-window.js",
			setting,
			"wallpaper-setting"
		);
		let   favorites: {
			 name: string, type: number
		}[]          = [];
		
		Object.keys(setting.favoriteImageSet).map((name) => { favorites.push({ name: name, type: type.Image });});
		Object.keys(setting.favoriteSlideSet).map((name) => { favorites.push({ name: name, type: type.Slide});});

		let   selection                                   = favorites[choice(0, favorites.length -1)];

		if (selection.type === type.Image) {
			let favorite = setting.favoriteImageSet[selection.name];

			setting.setFilePath (favorite.filePath);
			setting.setOpacity  (favorite.opacity);

			installer.install();
		} else {
			let favorite = setting.favoriteSlideSet[selection.name];

			setting.setSlideFilePaths    (favorite.slideFilePaths);
			setting.setOpacity           (favorite.opacity);
			setting.setSlideInterval     (favorite.slideInterval);
			setting.setSlideIntervalUnit (favorite.slideIntervalUnit);
			setting.setSlideRandomPlay   (favorite.slideRandomPlay);
			setting.setSlideEffectFadeIn (favorite.slideEffectFadeIn);

			installer.installAsSlide();
		}
	}
}