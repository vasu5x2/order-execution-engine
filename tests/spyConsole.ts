export function spyOnConsoleLog() {
  const original = console.log;
  const calls: any[][] = [];

  console.log = (...args: any[]) => {
    calls.push(args);
    original(...args);
  };

  return {
    calls,
    restore() {
      console.log = original;
    }
  };
}
