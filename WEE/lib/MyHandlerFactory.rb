require 'MyHandler'
# 
# To change this template, choose Tools | Templates
# and open the template in the editor.
module MyHandlerFactory 
  def create_handler
    return MyHandler.new
  end
end