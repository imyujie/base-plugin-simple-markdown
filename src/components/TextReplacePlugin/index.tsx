import { realmPlugin, createRootEditorSubscription$ } from '@mdxeditor/editor';
import { TextNode } from 'lexical';

function getNextDayOfWeek(dayOfWeek: number): Date { // 0=Sun, 1=Mon, ..., 6=Sat
  const date = new Date();
  const currentDay = date.getDay();
  let diff = dayOfWeek - currentDay;
  if (diff < 0) {
    diff += 7;
  }
  date.setDate(date.getDate() + diff);
  return date;
}

function textReplaceTransform(node: TextNode) {
  const text = node.getTextContent();

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  };

  const afterTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  };

  function getThisWeekDay(dayOfWeek: number): Date { // 1=Mon, ..., 7=Sun
    const today = new Date();
    let currentDay = today.getDay(); // 0=Sun, 1=Mon, ...
    if (currentDay === 0) currentDay = 7; // Make Sunday 7
    const distance = dayOfWeek - currentDay;
    today.setDate(today.getDate() + distance);
    return today;
  }

  function getNextWeekDay(dayOfWeek: number): Date { // 1=Mon, ..., 7=Sun
    const today = new Date();
    let currentDay = today.getDay(); // 0=Sun, 1=Mon, ...
    if (currentDay === 0) currentDay = 7; // Make Sunday 7
    const distance = dayOfWeek - currentDay;
    today.setDate(today.getDate() + distance + 7);
    return today;
  }

  const triggers: Record<string, () => Date> = {
    '@td ': () => new Date(),
    '@today ': () => new Date(),
    '@今天 ': () => new Date(),
    '@tmr ': tomorrow,
    '@明天 ': tomorrow,
    '@dat ': afterTomorrow,
    '@后天 ': afterTomorrow,
    '@mon ': () => getNextDayOfWeek(1),
    '@周一 ': () => getNextDayOfWeek(1),
    '@tue ': () => getNextDayOfWeek(2),
    '@周二 ': () => getNextDayOfWeek(2),
    '@wed ': () => getNextDayOfWeek(3),
    '@周三 ': () => getNextDayOfWeek(3),
    '@thu ': () => getNextDayOfWeek(4),
    '@周四 ': () => getNextDayOfWeek(4),
    '@fri ': () => getNextDayOfWeek(5),
    '@周五 ': () => getNextDayOfWeek(5),
    '@本周一 ': () => getThisWeekDay(1),
    '@本周二 ': () => getThisWeekDay(2),
    '@本周三 ': () => getThisWeekDay(3),
    '@本周四 ': () => getThisWeekDay(4),
    '@本周五 ': () => getThisWeekDay(5),
    '@本周六 ': () => getThisWeekDay(6),
    '@本周日 ': () => getThisWeekDay(7),
    '@这周一 ': () => getThisWeekDay(1),
    '@这周二 ': () => getThisWeekDay(2),
    '@这周三 ': () => getThisWeekDay(3),
    '@这周四 ': () => getThisWeekDay(4),
    '@这周五 ': () => getThisWeekDay(5),
    '@这周六 ': () => getThisWeekDay(6),
    '@这周日 ': () => getThisWeekDay(7),
    '@下周一 ': () => getNextWeekDay(1),
    '@下周二 ': () => getNextWeekDay(2),
    '@下周三 ': () => getNextWeekDay(3),
    '@下周四 ': () => getNextWeekDay(4),
    '@下周五 ': () => getNextWeekDay(5),
    '@下周六 ': () => getNextWeekDay(6),
    '@下周日 ': () => getNextWeekDay(7),
  };

  for (const trigger in triggers) {
    if (text.endsWith(trigger)) {
      const date = triggers[trigger]();
      // const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${month}${day}`;

      node.spliceText(text.length - trigger.length, trigger.length, formattedDate, true);
      return; // Exit after first match
    }
  }
}

export const textReplacePlugin = realmPlugin({
  init: (realm) => {
    realm.pub(createRootEditorSubscription$, (editor) => {
      return editor.registerNodeTransform(TextNode, textReplaceTransform);
    });
  },
});