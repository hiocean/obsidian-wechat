import juice from "juice";
import { Notice } from "obsidian";

export function processDoubleLink(htmlString: string): string {
	return htmlString.replace(/\[\[(.*?)\]\]/g, `<a href="">$1</a>`);
}
export function processCallout(
	htmlString: string,
	svgMap: Record<string, string>,
	htmlTAG = "blockquote"
): string {
	const blockRegex = /<(\/?)(p|blockquote|h\d)>(.*)/gi;
	const calloutRegex = /^(?:<(p|blockquote|h\d)>)?(\[!(.*?)\])/i;

	let htmlBlocks = [];
	let calloutTypes = [];
	let match;
	// 使用正则表达式全局搜索匹配所有块级元素
	while ((match = blockRegex.exec(htmlString)) !== null) {
		let pContent = match[0];
		let currentTag = match[2];
		let closed = match[1] !== "";

		if (calloutRegex.test(pContent)) {
			//匹配关键词找到callout
			const typeMatch = calloutRegex.exec(pContent);
			const calloutType = typeMatch[3];

			calloutTypes.push("callout-" + calloutType);
			//替换为图标
			pContent = pContent.replace(typeMatch[2], svgMap[calloutType]);
			//增加title标签
			pContent = pContent.replace(/<p>|<\/p>/, "");
			pContent = `<callout-title>` + pContent + `</callout-title>`;
			//增加callout 开始标签
			pContent =
				`<callout><${calloutTypes[calloutTypes.length - 1]}>` +
				pContent;
		}
		if (currentTag === htmlTAG && closed) {
			if (calloutTypes.length > 0) {
				pContent = `</${calloutTypes.pop()}></callout>` + pContent;
			}
		}
		htmlBlocks.push(pContent);
	}
	return htmlBlocks.join("\n");
}

export async function solveHTML(
	htmlString: string,
	cssString: string
): Promise<string> {
	htmlString = htmlString.replace(
		/<mjx-container (class="inline.+?)<\/mjx-container>/g,
		"<span $1</span>"
	);
	htmlString = htmlString.replace(
		/\s<span class="inline/g,
		'&nbsp;<span class="inline'
	);
	htmlString = htmlString.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
	htmlString = htmlString.replace(/mjx-container/g, "section");
	htmlString = htmlString.replace(
		/class="mjx-solid"/g,
		'fill="none" stroke-width="70"'
	);
	htmlString = htmlString.replace(
		/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g,
		""
	);
	let res = "";
	try {
		res = juice.inlineContent(htmlString, cssString + "", {
			inlinePseudoElements: true,
			preserveImportant: true,
		});
	} catch (e) {
		new Notice("请检查 CSS 文件是否编写正确！");
	}

	return res;
}

export function processCode(htmlString: string) {
	// 使用正则表达式匹配 <code> 标签中的内容
	const formattedHTML = htmlString.replace(
		/(<code[^>]*>)(.*?)<\/code>/gs,
		function (match, p1, p2) {
			let replacedCode = "";
			const lines = p2.split("\n");
			for (let i = 0; i < lines.length - 1; i++) {
				replacedCode += p1 + lines[i] + "</code>";
			}
			return p1 + replacedCode;
		}
	);
	return formattedHTML;
}
