require_relative 'elasticsearch_logging'

YAML.load_stream(File.open('trace.yaml')) do |document|
  l = Logging.new({})

  tdoc = { :received => document.dig(:notification,'received') }
  paths = [[]]
  anal  = []
  l.traverse(tdoc,paths,anal)
  anal.uniq!

  p anal
  res = l.duplicate(tdoc,paths,anal)
  # res.each do |r|
  #   pp r
  # end
end
