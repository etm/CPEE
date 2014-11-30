# encoding: UTF-8
#
# This file is part of CPEE.
#
# Apache License, Version 2.0
#
# Copyright (c) 2013 Juergen Mangler
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

module CPEE

  module ProcessTransformation

    module Target

      class Default
        def initialize(tree)
          @tree = tree
        end
        def generate(node)
          generate_for_list(@tree,node)
        end

        def generate_for_list(list,res)
          list.each do |e|
            nam = e.class.name.gsub(/\w+:+/,'')
            send("print_#{nam}".to_sym,e,res)
          end
        end

      end

    end

  end

end
