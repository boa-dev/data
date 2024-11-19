import fs from "node:fs";

const engines = new Map();
engines.set("boa", {});
engines.set("v8-jitless", {});
engines.set("sm-jitless", {});
engines.set("kiesel", {});
// https://github.com/boa-dev/data/pull/13
// engines.set("libjs", {});
engines.set("duktape", {});
engines.set("quickjs", {});

const benchmarks = [
  "Richards",
  "DeltaBlue",
  "Crypto",
  "RayTrace",
  "EarleyBoyer",
  "RegExp",
  "Splay",
  "NavierStokes",
  "score",
];

const resultsRegex = new RegExp('"?RESULT"?\\s"?(\\w+)"?\\s"?(\\d+)"?');
const scoreRegex = new RegExp('"?SCORE"?\\s"?(\\d+)"?');

// gather data from txt files
engines.forEach((val, engine) => {
  const results = fs.readFileSync(`./bench/${engine}_results.txt`).toString();
  const lines = results.split("\n");
  lines.forEach((line) => {
    const search = resultsRegex.exec(line);
    if (search === null) return;
    val[search[1]] = parseInt(search[2]);
  });
  val["score"] = parseInt(scoreRegex.exec(results)[1]);
});

// generate JSON files for each benchmark
benchmarks.forEach((benchmark) => {
  const data = JSON.parse(fs.readFileSync(`./bench/results/${benchmark}.json`));
  engines.forEach((val, engine) => {
    data["results"][engine].push(val[benchmark]);
  });
  data["results"]["libjs"].push(null);
  data["labels"].push(new Date().getTime());
  fs.writeFileSync(
    `./bench/results/${benchmark}.json`,
    JSON.stringify(data, null, 2)
  );
});
