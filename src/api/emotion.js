const emoTextList = ['Grin', 'Flirt', 'Happy', 'EvilGrin', 'Pitiful', 'Heart', 'LaughandCry', 'Clap', 'Surprise', 'Cheer',
	'Cry', 'Tearful', 'Hungry', 'Uncomfortable', 'Fitness', 'Love', 'Flirtatious', 'Blink', 'Rage', 'Fearful',
	'Thinking', 'Dizzy', 'Vomit', 'Cool Grin', 'Rolling', 'Enjoy', 'Snot', 'Happy', 'Jumping', 'Smile',
	'Greedy', 'Red Heart', 'PinkHeart', 'Star', 'BigFire', 'Eyes', 'MusicNote', "ExclamationMark", "QuestionMark", "GreenLeaf",
	"Burning", "Horn", "Warning", "Envelope", "House", "Gift", "ThumbsUp", "RaiseHand", "Clap", "Nod",
	'ShakeHead', 'Peek', 'Celebrate', 'RunFast', 'Roll', 'Shock', 'Jump','Jumps','Jumpss','Jumpsss'
];

let transform = (content) => {
	return content.replace(/\#[a-zA-Z]{1,10}\;/gi, textToImg);
}

// Replace matched results with emoji images
let textToImg = (emoText) => {
	let word = emoText.replace(/\#|\;/gi, '');
	let idx = emoTextList.indexOf(word);
	if(idx==-1){
		return emoText;
	}
	let url = require(`@/assets/emoji/${idx}.gif`);
	return `<img src="${url}" style="width:35px;height:35px;vertical-align:bottom;"/>`
}

let textToUrl = (emoText) => {
	let word = emoText.replace(/\#|\;/gi, '');
	let idx = emoTextList.indexOf(word);
	if(idx==-1){
		return "";
	}
	let url = require(`@/assets/emoji/${idx}.gif`);
	return url;
}

export default {
	emoTextList,
	transform,
	textToImg,
	textToUrl
}
