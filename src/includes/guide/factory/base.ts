import { AbstractGuide }          from "../base/abc";
import { StartMenuGuide }         from "../begin";
import { BaseInputGuide }         from "../base/input";
import { BaseQuickPickGuide }     from "../base/pick";
import { BaseConfirmGuide }       from "../confirm";
import { ImageFilePathGuide }     from "../image";
import { OpacityGuide }           from "../opacity";
import {
	SlideFilePathsGuide,
	SlideIntervalGuide,
	SlideRandomPlayGuide,
} from "../slide";
import { SetupImageGuideEnd }     from "../image";
import {
	SelectSetupType
} from "../select/wallpaper";
import {
	SelectParameterType
} from "../select/parameter";
import {
	SelectFavoriteProcess,
	SelectFavoriteOperationType,
} from "../select/favorite";
import {
	RegisterFavoriteGuide,
	OpenFavoriteGuide,
	SelectExecuteOperationFavoriteGuide,
	FavoriteRandomSetGuide,
	FavoriteRandomSetFilterGuide
} from "../favorite";
import {
	SelectSyncProcess
} from "../select/sync";
import {
	SyncImageFilePathGuide,
	SyncEncryptSaltInputGuide,
	SyncDecryptSaltInputGuide,
} from "../sync";
import { InputJsonFilePathGuide } from "../optimize";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Constructable<T> { new (...args: Array<any>): T; }

export abstract class GuideFactory {
	private static guides: Record<string, Constructable<AbstractGuide>> = {};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static create(className: string, ...args: Array<any>): AbstractGuide {
		if (0 === Object.keys(this.guides).length) {
			this.init();
		}

		const guideName = Object.keys(this.guides).find(guide => guide === className);

		if (guideName) {
			return new this.guides[guideName](...args);
		} else {
			throw new ReferenceError("Requested " + className + " class not found...");
		}
	}

	private static init(): void {
		/* eslint-disable @typescript-eslint/naming-convention */
		this.guides = {
			StartMenuGuide:                      StartMenuGuide,
			BaseInputGuide:                      BaseInputGuide,
			BaseQuickPickGuide:                  BaseQuickPickGuide,
			BaseConfirmGuide:                    BaseConfirmGuide,
			ImageFilePathGuide:                  ImageFilePathGuide,
			SetupImageGuideEnd:                  SetupImageGuideEnd,
			OpacityGuide:                        OpacityGuide,
			SlideFilePathsGuide:                 SlideFilePathsGuide,
			SlideIntervalGuide:                  SlideIntervalGuide,
			SlideRandomPlayGuide:                SlideRandomPlayGuide,
			SelectSetupType:                     SelectSetupType,
			SelectParameterType:                 SelectParameterType,
			SelectFavoriteProcess:               SelectFavoriteProcess,
			SelectFavoriteOperationType:         SelectFavoriteOperationType,
			RegisterFavoriteGuide:               RegisterFavoriteGuide,
			OpenFavoriteGuide:                   OpenFavoriteGuide,
			SelectExecuteOperationFavoriteGuide: SelectExecuteOperationFavoriteGuide,
			FavoriteRandomSetGuide:              FavoriteRandomSetGuide,
			FavoriteRandomSetFilterGuide:        FavoriteRandomSetFilterGuide,
			SelectSyncProcess:                   SelectSyncProcess,
			SyncImageFilePathGuide:              SyncImageFilePathGuide,
			SyncEncryptSaltInputGuide:           SyncEncryptSaltInputGuide,
			SyncDecryptSaltInputGuide:           SyncDecryptSaltInputGuide,
			InputJsonFilePathGuide:              InputJsonFilePathGuide,
		}
		/* eslint-enable @typescript-eslint/naming-convention */
	}
}
