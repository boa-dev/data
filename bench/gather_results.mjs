import fs from "node:fs";
import process from "node:process";

const engines = new Map();
engines.set("boa", {});
engines.set("v8-jitless", {});
engines.set("sm-jitless", {});
engines.set("kiesel", {});
engines.set("libjs", {});
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
const time = new Date().getTime();

// gather data from txt files
engines.forEach((val, engine) => {
  let results;
  try {
    results = fs.readFileSync(`./bench/${engine}_results.txt`).toString();
  } catch {
    for (const benchmark of benchmarks) {
      val[benchmark] = null;
    }
    return;
  }
  const lines = results.split("\n");
  lines.forEach((line) => {
    const search = resultsRegex.exec(line);
    if (search === null) return;
    val[search[1]] = parseInt(search[2]);
  });
  val["score"] = parseInt(scoreRegex.exec(results)[1]);
});


const postData = { results: {}, time};
// generate JSON files for each benchmark
benchmarks.forEach((benchmark) => {
  const data = JSON.parse(fs.readFileSync(`./bench/results/${benchmark}.json`));
  // don't have uppercase names, e.g: RayTrace -> rayTrace
  const benchmarkNormalized = benchmark.charAt(0).toLowerCase() + benchmark.slice(1);
  postData.results[benchmarkNormalized] = {};
  engines.forEach((val, engine) => {
    data["results"][engine].push(val[benchmark]);
    postData.results[benchmarkNormalized][engine] = val[benchmark];
  });
  data["labels"].push(time);
  fs.writeFileSync(
    `./bench/results/${benchmark}.json`,
    JSON.stringify(data, null, 2)
  );
});

try {
  const response = await fetch("https://boa-api.jason-williams.co.uk/populate", {
    body: JSON.stringify(postData),
    headers: {
      "Content-Type": "application/json",
      "BENCHMARKS-API-KEY": process.env["BENCHMARKS_API_KEY"]
    },
    method: 'POST'
  });

  if (!response.ok) {
    console.error(`Failed with status code ${response.status}`)
  }
} catch (e) {
  console.error(e);
}
