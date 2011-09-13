Gem::Specification.new do |s|
  s.name             = "wee"
  s.version          = "1.2.0"
  s.platform         = Gem::Platform::RUBY
  s.summary          = "workflow execution engine (wee) library"

  s.description = <<-EOF
Write useful stuff.

Also see http://www.pri.univie.ac.at/workgroups/wee/.
EOF

  s.files            = Dir['{lib/*,example/simple/*}'] + %w(COPYING Rakefile wee.gemspec README AUTHORS)
  s.require_path     = 'lib'
  s.extra_rdoc_files = ['README']
  s.test_files       = Dir['test/*/tc_*.rb']

  s.authors          = ['Gerhard Stuermer, Juergen eTM Mangler']
  s.email            = 'juergen.mangler@gmail.com'
  s.homepage         = 'http://www.pri.univie.ac.at/workgroups/wee/'

  s.add_development_dependency 'riddl'
end
