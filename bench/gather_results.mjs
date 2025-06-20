import fs from "node:fs";

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


const postData = { results: {} };
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
  data["labels"].push(new Date().getTime());
  fs.writeFileSync(
    `./bench/results/${benchmark}.json`,
    JSON.stringify(data, null, 2)
  );
});

// Send off data to API
postData.time = new Date().getTime();
try {
  const response = await fetch("http://boa-api.jason-williams.co.uk/populate", {
    body: JSON.stringify(postData),
    headers: {
      "Content-Type": "application/json"
    },
    method: 'POST'
  });

  if (!response.ok) {
    console.error(`Failed with status code ${response.status}`)
  }
} catch (e) {
  console.error(e);
}
