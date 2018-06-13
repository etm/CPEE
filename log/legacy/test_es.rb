require 'faraday'
require 'elasticsearch'
require 'logger'

client = Elasticsearch::Client.new hosts: ['localhost:8400']
unless client.indices.exists? index: 'trace'
  client.indices.create index: 'trace', body: {
    "mappings" => {
      "entry" => {
        "properties" => {
          "concept:name" => {
            "type" => "integer"
          },
          "cpee:name" => {
            "type" => "text"
          },
          "cpee:uuid": {
            "type" => "text"
          }
        }
      }
    }
  }
end

client.index  index: 'trace', type: 'entry', id: , body: log["log"]["trace"]
