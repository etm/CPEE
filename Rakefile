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

desc "Clean instances"
task :clean do
  Dir.glob("server/instances/*").collect{ |i| i if i =~ /\/\d+$/ }.compact.each do |i|
    rm_rf i if File.exists?(i) 
  end
end  
