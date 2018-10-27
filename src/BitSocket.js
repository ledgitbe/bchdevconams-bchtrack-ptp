export default function BitSocket(_query) {
  let query = _query || {
    "v": 3,
    "q": {
      //"find": { "out.h1": "44debc0a" , "out.h2": "30", "out.h3": "3333", "out.h4":{"$gt":"29"}}
      "find": {}
    },

    "r": { "f": "." }
  };

  let b64 = btoa(JSON.stringify(query));

  return new EventSource('https://bitsocket.org/s/' + b64);
}
