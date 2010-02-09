require 'rake'
require 'rake/gempackagetask'
require 'rake/testtask'
require 'rake/rdoctask'

Rake::TestTask.new do |t|
  t.libs << "test"
  t.test_files = FileList['test/*/tc_*.rb']
  t.verbose = false
end

spec = eval(File.read('wee.gemspec'))
Rake::GemPackageTask.new(spec) do |pkg|
  pkg.need_zip = true
  pkg.need_tar = true
end

