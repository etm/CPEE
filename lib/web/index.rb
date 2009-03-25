# -*- ruby -*-
require '../lib/rum'
require 'WebWorkflow'

use Rack::ShowStatus
run Rum.new {
  def display_mask
    puts "<h1>Output</h1>"
    puts "<p>#{$message}</p>"

    puts "<h1>Control</h1>"
    puts "<form>"
    puts "<textarea name=\"code\" cols=\"80\" rows=\"20\"></textarea>"
    puts "  <input type=\"submit\"/>"
    puts "</form>"
  end

  on param "code" do |code|
    puts "Evaluating: #{code}"
    eval(code)
    sleep(1)
    display_mask
  end
  on default do
    $message = "Creating new Workflow"
    $wf = WebWorkflow.new
    $message += "Executing wf in a new thread<BR/>"
    $wf_thread = Thread.new { $wf_result = wf.execute }
    sleep(2)
    $message += "Showing results<BR/>"
    display_mask
  end
}
