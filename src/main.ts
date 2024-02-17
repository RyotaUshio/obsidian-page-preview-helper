import { HoverParent, Plugin } from 'obsidian';
import { around } from 'monkey-around';


interface HoverLinkContext {
	event: MouseEvent;
	source: string;
	hoverParent: HoverParent;
	targetEl?: HTMLElement;
	linktext: string;
	sourcePath?: string;
	state?: any;
}

interface PagePreviewPlugin {
	instance: {
		onHoverLink(ctx: HoverLinkContext): void;
	}
	enabled: boolean;
	enable(): void;
	disable(): void;
}

declare module 'obsidian' {
	interface App {
		internalPlugins: {
			plugins: {
				'page-preview': PagePreviewPlugin;
			}
		};
	}
}

export default class MyPlugin extends Plugin {
	async onload() {
		this.app.workspace.onLayoutReady(() => {
			const pagePreview = this.app.internalPlugins.plugins['page-preview'];
			this.patchPagePreview(pagePreview);
			this.refleshPagePreview(pagePreview);	
		});
	}

	patchPagePreview(pagePreview: PagePreviewPlugin) {
		this.register(around(pagePreview.instance.constructor.prototype, {
			onHoverLink(old) {
				return function (ctx: HoverLinkContext) {
					if (ctx.source === 'preview' && ctx.targetEl && ctx.targetEl.closest('.is-live-preview')) {
						ctx.source = 'editor';
					}
					return old.call(this, ctx);
				}
			}
		}));
	}

	/** Re-register the `workspace.on("hover-link", ...)` event handler so that the patch takes effect. */
	refleshPagePreview(pagePreview: PagePreviewPlugin) {
		pagePreview.disable();
		pagePreview.enable();

		this.register(() => {
			if (pagePreview.enabled) {
				pagePreview.disable();
				pagePreview.enable();
			}
		});
	}
}
