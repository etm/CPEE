#!/usr/bin/ruby
# encoding: UTF-8
#
# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'rubygems'
require File.expand_path(File.dirname(__FILE__) + '/../../lib/cpee/processtransformation/bpmn2')
require File.expand_path(File.dirname(__FILE__) + '/../../lib/cpee/processtransformation/cpee')

Dir.chdir(File.expand_path(File.dirname(__FILE__)))
Dir["*.bpmn"].each do |f|
  puts f
  bpmn2 = CPEE::ProcessTransformation::Source::BPMN2.new(File.read(f))
  bpmn2.build_traces
  tree = bpmn2.build_tree(false).to_s
  xml = bpmn2.generate_model(CPEE::ProcessTransformation::Target::CPEE)
  fname = File.basename(f,'.bpmn')
  File.write(fname + '.tree',tree)
  File.write(fname + '.xml',xml)
end
